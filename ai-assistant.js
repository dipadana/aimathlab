(function () {
  'use strict';

  let _isStreaming = false;
  let _abortCtrl = null;
  let _chatHistory = [];
  let _isQuizMode = false;
  let _ttsEnabled = false;
  let _isDrawMode = false;
  let _drawLayer = null;
  let _drawCtx = null;
  let _isDrawing = false;

  const _profileManager = {
    _cache: null,
    _lastUserId: null,
    async init() {
      const auth = window.AIMLAuth;
      const user = auth?.getUser();
      if (!auth || !user) {
        this._cache = {};
        this._lastUserId = null;
        return;
      }
      if (this._lastUserId === user.id && this._cache) return;
      
      this._lastUserId = user.id;
      if (auth.getSupabase()) {
        try {
          const { data } = await auth.getSupabase()
            .from('user_states')
            .select('state')
            .eq('user_id', user.id)
            .eq('page_name', '_ai_profile')
            .maybeSingle();
          if (data && data.state) {
            this._cache = data.state;
            return;
          }
        } catch (e) { console.warn("AI Profile load err:", e); }
      }
      this._cache = {};
    },
    get() { return this._cache || {}; },
    async update(key, value) {
      const auth = window.AIMLAuth;
      if (!auth || !auth.getUser() || !auth.getSupabase()) {
        if (auth && auth.openAuthModal) auth.openAuthModal();
        return false;
      }
      if (!this._cache) this._cache = {};
      this._cache[key] = value;
      try {
        await auth.getSupabase().from('user_states').upsert({
          user_id: auth.getUser().id,
          page_name: '_ai_profile',
          state: this._cache,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,page_name' });
        return true;
      } catch(e) { return false; }
    },
    getSummary() {
      const auth = window.AIMLAuth;
      if (!auth || !auth.getUser()) {
        return "User is NOT logged in. The Learning Profile is disabled. Prompt the user to log in (top right button) if they want a personalized learning experience! DO NOT use the update_profile tool.";
      }
      const p = this.get();
      if (Object.keys(p).length === 0) return "No profile data yet.";
      return Object.entries(p).map(([k, v]) => `${k}: ${v}`).join(', ');
    }
  };

  window.AIMathTutor = {
    ask,
    cancel,
    isStreaming: () => _isStreaming,
    renderCard,
    toggleQuizMode,
    clearHistory,
    toggleTTS,
    toggleDrawMode,
    clearDrawLayer
  };

  function toggleDrawMode() {
    _isDrawMode = !_isDrawMode;
    const btn = document.getElementById('ai-draw-btn');
    if (btn) btn.classList.toggle('active', _isDrawMode);
    
    if (_isDrawMode && !_drawLayer) {
      initDrawLayer();
    }
    if (_drawLayer) {
      _drawLayer.style.pointerEvents = _isDrawMode ? 'auto' : 'none';
    }
  }

  function initDrawLayer() {
    const mainCanvas = document.querySelector('canvas:not(#ai-draw-layer)');
    if (!mainCanvas) return;
    const wrap = mainCanvas.parentElement;
    if (!wrap) return;

    if (getComputedStyle(wrap).position === 'static') {
      wrap.style.position = 'relative';
    }

    _drawLayer = document.createElement('canvas');
    _drawLayer.id = 'ai-draw-layer';
    _drawLayer.width = mainCanvas.width;
    _drawLayer.height = mainCanvas.height;
    _drawLayer.style.position = 'absolute';
    _drawLayer.style.top = mainCanvas.offsetTop + 'px';
    _drawLayer.style.left = mainCanvas.offsetLeft + 'px';
    _drawLayer.style.width = mainCanvas.style.width || mainCanvas.offsetWidth + 'px';
    _drawLayer.style.height = mainCanvas.style.height || mainCanvas.offsetHeight + 'px';
    _drawLayer.style.pointerEvents = 'auto';
    _drawLayer.style.zIndex = '10';
    _drawLayer.style.cursor = 'crosshair';
    _drawLayer.style.background = 'transparent';
    
    wrap.appendChild(_drawLayer);
    _drawCtx = _drawLayer.getContext('2d');
    _drawCtx.strokeStyle = '#e02020';
    _drawCtx.lineWidth = 3;
    _drawCtx.lineCap = 'round';
    _drawCtx.lineJoin = 'round';

    const getPos = (e) => {
      const rect = _drawLayer.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const scaleX = _drawLayer.width / rect.width;
      const scaleY = _drawLayer.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    const startDraw = (e) => {
      if (!_isDrawMode) return;
      e.preventDefault();
      _isDrawing = true;
      const pos = getPos(e);
      _drawCtx.beginPath();
      _drawCtx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
      if (!_isDrawing || !_isDrawMode) return;
      e.preventDefault();
      const pos = getPos(e);
      _drawCtx.lineTo(pos.x, pos.y);
      _drawCtx.stroke();
    };

    const endDraw = () => { _isDrawing = false; };

    _drawLayer.addEventListener('mousedown', startDraw);
    _drawLayer.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', endDraw);
    _drawLayer.addEventListener('touchstart', startDraw, {passive:false});
    _drawLayer.addEventListener('touchmove', draw, {passive:false});
    window.addEventListener('touchend', endDraw);
  }

  function clearDrawLayer() {
    if (_drawCtx && _drawLayer) {
      _drawCtx.clearRect(0, 0, _drawLayer.width, _drawLayer.height);
    }
  }

  function toggleTTS() {
    _ttsEnabled = !_ttsEnabled;
    const btn = document.getElementById('ai-speaker-btn');
    if (btn) btn.classList.toggle('active', _ttsEnabled);
    if (!_ttsEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
  }

  function speakText(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const cleanText = text.replace(/\[\[.*?\]\]/g, '')
                          .replace(/[*_#`]/g, '')
                          .replace(/\$.*?\$/g, ' equation ')
                          .trim();
    if (!cleanText) return;

    const utter = new SpeechSynthesisUtterance(cleanText);
    const lang = document.body.getAttribute('data-active-lang') || 'en';
    const localeMap = { en: 'en-US', ja: 'ja-JP', id: 'id-ID' };
    utter.lang = localeMap[lang] || 'en-US';
    window.speechSynthesis.speak(utter);
  }

  function toggleQuizMode() {
    _isQuizMode = !_isQuizMode;
    const btn = document.getElementById('ai-quiz-btn');
    if (btn) btn.classList.toggle('active', _isQuizMode);
    clearHistory();
    if (window.buildAIContext) window.buildAIContext();
  }

  function clearHistory() {
    _chatHistory = [];
    const body = document.getElementById('ai-card-body');
    if (body) body.innerHTML = idlePlaceholder();
  }

  async function ask(systemContextMsgs, cardId, userMessage = null, isFollowUp = false, previousUIString = '', existingAiMsgEl = null) {
    if (_isStreaming) return;
    
    const inputField = document.getElementById('ai-chat-input');
    const body = document.getElementById('ai-card-body');
    const explainBtn = document.getElementById('ai-explain-btn');
    const sendBtn = document.getElementById('ai-send-btn');
    
    if (!body) return;

    if (body.querySelector('.ai-placeholder')) {
      body.innerHTML = '';
    }

    _isStreaming = true;
    _abortCtrl = new AbortController();

    setCardState('loading', explainBtn, sendBtn);

    if (!isFollowUp) {
      if (userMessage) {
        _chatHistory.push({ role: 'user', content: userMessage });
        appendMessageUI('user', userMessage);
        if (inputField) inputField.value = '';
      } else {
        const lang = document.body.getAttribute('data-active-lang') || 'en';
        const defaultReq = {
          en: _isQuizMode ? 'Please give me a quiz challenge based on this.' : 'Please explain what I am seeing.',
          ja: _isQuizMode ? 'これに基づいたクイズを出してください。' : '見ている内容を説明してください。',
          id: _isQuizMode ? 'Tolong berikan saya kuis berdasarkan ini.' : 'Tolong jelaskan apa yang saya lihat.'
        };
        _chatHistory.push({ role: 'user', content: defaultReq[lang] });
        appendMessageUI('user', defaultReq[lang]);
      }
    }
    await _profileManager.init();

    let payloadMessages = [];
    if (systemContextMsgs && systemContextMsgs.length > 0) {
      let sysContent = systemContextMsgs[0].content;
      sysContent = sysContent.replace('__PROFILE_PLACEHOLDER__', _profileManager.getSummary());
      payloadMessages.push({ role: 'system', content: sysContent });
    }
    
    if (_isQuizMode) {
      payloadMessages[0].content += `\n\nQUIZ MODE ACTIVE: Act as an examiner. Do NOT explain the math directly. Instead, give the user a specific challenge to complete by adjusting the visualizer parameters. When they ask to check their answer, evaluate their success based on the live visualizer state provided in the context.`;
    }

    payloadMessages = payloadMessages.concat(_chatHistory);

    if (payloadMessages.length > 0) {
      const lastIdx = payloadMessages.length - 1;
      const lastMsg = payloadMessages[lastIdx];
      if (lastMsg.role === 'user') {
        const lang = document.body.getAttribute('data-active-lang') || 'en';
        let augmentedText = typeof lastMsg.content === 'string' ? lastMsg.content : (lastMsg.content[0]?.text || '');

        if (lang === 'ja') {
          augmentedText += '\n\n[CRITICAL: あなたは賢いAIチューターです。必ず「日本語」で回答してください。英語は絶対に使用しないでください。]';
        } else if (lang === 'id') {
          augmentedText += '\n\n[SANGAT PENTING: Anda adalah tutor AI yang cerdas. Jawab HANYA menggunakan "Bahasa Indonesia". Jangan gunakan bahasa Inggris dalam respons akhir Anda.]';
        }

        let finalContent = [{ type: 'text', text: augmentedText }];

        const activeCanvas = document.querySelector('canvas:not(#ai-draw-layer)');
        if (activeCanvas) {
          try {
            let currentCanvasBase64 = null;
            if (_drawLayer) {
              const mergeCanvas = document.createElement('canvas');
              mergeCanvas.width = activeCanvas.width;
              mergeCanvas.height = activeCanvas.height;
              const mergeCtx = mergeCanvas.getContext('2d');
              mergeCtx.drawImage(activeCanvas, 0, 0);
              mergeCtx.drawImage(_drawLayer, 0, 0);
              currentCanvasBase64 = mergeCanvas.toDataURL('image/jpeg', 0.8);
            } else {
              currentCanvasBase64 = activeCanvas.toDataURL('image/jpeg', 0.8);
            }
            finalContent.push({ type: 'image_url', image_url: { url: currentCanvasBase64 } });
          } catch (e) {
            console.warn('Could not capture canvas image:', e);
          }
        }
        
        payloadMessages[lastIdx] = { role: 'user', content: finalContent };
      }
      
      const lang = document.body.getAttribute('data-active-lang') || 'en';
      if (lang === 'ja') {
        payloadMessages.push({ role: 'system', content: 'CRITICAL: You MUST write your final response in Japanese (日本語). Do NOT use English.' });
      } else if (lang === 'id') {
        payloadMessages.push({ role: 'system', content: 'CRITICAL: You MUST write your final response in Indonesian (Bahasa Indonesia). Do NOT use English.' });
      }
    }

    try {
      const tools = [
        { type: "function", function: { name: "set_parameter", description: "Adjusts a visualizer parameter slider live.", parameters: { type: "object", properties: { id: { type: "string" }, value: { type: "number" } }, required: ["id", "value"] } } },
        { type: "function", function: { name: "highlight_element", description: "Draws the user's attention to a specific UI element by pulsing it.", parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } } },
        { type: "function", function: { name: "annotate", description: "Shows a floating visual annotation overlay over the canvas.", parameters: { type: "object", properties: { message: { type: "string" } }, required: ["message"] } } },
        { type: "function", function: { name: "update_profile", description: "Updates the user's learning profile.", parameters: { type: "object", properties: { subject: { type: "string" }, proficiency: { type: "string" } }, required: ["subject", "proficiency"] } } },
        { type: "function", function: { name: "render_custom_ui", description: "Generates an isolated, interactive HTML snippet in a sandbox iframe inside the chat.", parameters: { type: "object", properties: { html: { type: "string", description: "The raw HTML string, including inline CSS and JS" }, height: { type: "number", description: "The height in pixels of the iframe" } }, required: ["html", "height"] } } }
      ];

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payloadMessages, stream: true, tools: tools }),
        signal: _abortCtrl.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        appendMessageUI('error', err.error || 'API error');
        _isStreaming = false;
        setCardState('idle', explainBtn, sendBtn);
        return;
      }

      setCardState('streaming', explainBtn, sendBtn);

      let aiMsgEl = existingAiMsgEl || appendMessageUI('assistant', '');
      const textEl = aiMsgEl.querySelector('.ai-stream-text');
      const lang = document.body.getAttribute('data-active-lang') || 'en';
      
      if (previousUIString) {
        textEl.innerHTML = parseMarkdown(previousUIString, false);
      } else {
        const tWords = { en: 'Thinking...', ja: '考え中...', id: 'Berpikir...' };
        textEl.innerHTML = `<div class="ai-thinking"><i class="fa-solid fa-brain fa-bounce"></i> ${tWords[lang] || tWords.en}</div>`;
      }
      
      const cursor = document.createElement('span');
      cursor.className = 'ai-cursor';
      cursor.textContent = '\u258c';
      textEl.appendChild(cursor);

      body.scrollTop = body.scrollHeight;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';
      let toolCalls = {};
      let injectedThink = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const json = JSON.parse(data);
            if (json.error) {
              cursor.remove();
              appendMessageUI('error', 'The AI gateway is temporarily unavailable.');
              _isStreaming = false;
              _abortCtrl = null;
              setCardState('idle', explainBtn, sendBtn);
              return;
            }
            const delta = json.choices?.[0]?.delta?.content || '';
            const reasoning = json.choices?.[0]?.delta?.reasoning_content || '';
            const deltaToolCalls = json.choices?.[0]?.delta?.tool_calls;
            
            if (deltaToolCalls) {
              for (const tc of deltaToolCalls) {
                if (!toolCalls[tc.index]) toolCalls[tc.index] = { id: tc.id, name: tc.function?.name, arguments: '' };
                if (tc.function?.arguments) toolCalls[tc.index].arguments += tc.function.arguments;
              }
            }
            
            if (reasoning) {
              if (!injectedThink) { injectedThink = true; fullResponse += '<think>\n'; }
              fullResponse += reasoning;
            }
            if (delta) {
              if (injectedThink) { injectedThink = false; fullResponse += '\n</think>\n\n'; }
              fullResponse += delta;
            }

            if (delta || reasoning) {
              const displayableText = fullResponse.replace(/\[\[(SET|HIGHLIGHT|ANNOTATE|UPDATE_PROFILE):\s*([^\]]+)\]\]/g, '');
              const combinedText = previousUIString + (previousUIString && displayableText ? '\n\n' : '') + displayableText;
              textEl.innerHTML = parseMarkdown(combinedText, false);
              textEl.appendChild(cursor);
              body.scrollTop = body.scrollHeight;
            }
          } catch {}
        }
      }

      cursor.remove();
      
      if (injectedThink) {
        fullResponse += '\n</think>\n\n';
      }
      
      const finalDisplayableText = fullResponse.replace(/\[\[(SET|HIGHLIGHT|ANNOTATE|UPDATE_PROFILE):\s*([^\]]+)\]\]/g, '');
      const finalCombinedText = previousUIString + (previousUIString && finalDisplayableText ? '\n\n' : '') + finalDisplayableText;
      textEl.innerHTML = parseMarkdown(finalCombinedText, true);

      _chatHistory.push({ role: 'assistant', content: fullResponse });
      
      for (const idx in toolCalls) {
        const tc = toolCalls[idx];
        try {
          const args = JSON.parse(tc.arguments);
          executeToolCall(tc.name, args, body);
          
          _chatHistory.push({ role: 'assistant', tool_calls: [{ id: tc.id, type: 'function', function: { name: tc.name, arguments: tc.arguments } }] });
          _chatHistory.push({ role: 'tool', tool_call_id: tc.id, content: "Success" });
        } catch (e) { console.error("Tool parsing error", e); }
      }

      parseAndExecuteCommands(fullResponse);

      if (window.MathJax) {
        window.MathJax.typesetPromise([textEl]).catch(() => {});
      }
      
      if (_ttsEnabled) {
        speakText(finalDisplayableText);
      }

      if (Object.keys(toolCalls).length > 0) {
        _isStreaming = false;
        
        const displayableText = fullResponse.replace(/\[\[(SET|HIGHLIGHT|ANNOTATE|UPDATE_PROFILE):\s*([^\]]+)\]\]/g, '');
        const combinedForNext = previousUIString + (previousUIString && displayableText ? '\n\n' : '') + displayableText;
        
        await ask(systemContextMsgs, cardId, null, true, combinedForNext, aiMsgEl);
        return;
      }

      setCardState('idle', explainBtn, sendBtn);

    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error("AI Ask Error:", e);
        appendMessageUI('error', 'Error: ' + e.message);
      }
      setCardState('idle', explainBtn, sendBtn);
    } finally {
      _isStreaming = false;
      _abortCtrl = null;
    }
  }

  function executeToolCall(name, args, body) {
    if (name === 'set_parameter') {
      const el = document.getElementById(args.id);
      if (el) {
        el.value = args.value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else if (name === 'highlight_element') {
      const el = document.getElementById(args.id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ai-highlight-pulse');
        setTimeout(() => el.classList.remove('ai-highlight-pulse'), 3000);
      }
    } else if (name === 'annotate') {
      const container = document.querySelector('.canvas-column') || document.body;
      const overlay = document.createElement('div');
      overlay.className = 'ai-annotation-overlay';
      overlay.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${args.message}`;
      container.appendChild(overlay);
      setTimeout(() => {
        overlay.classList.add('ai-annotation-fade-out');
        setTimeout(() => overlay.remove(), 400);
      }, 5000);
    } else if (name === 'update_profile') {
      _profileManager.update(args.subject, args.proficiency);
    } else if (name === 'render_custom_ui') {
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = (args.height || 200) + 'px';
      iframe.style.border = '1px solid var(--border2)';
      iframe.style.borderRadius = '8px';
      iframe.style.marginTop = '10px';
      iframe.style.background = '#fff';
      iframe.sandbox = "allow-scripts";
      iframe.srcdoc = args.html;
      
      const msgBubble = document.createElement('div');
      msgBubble.className = 'ai-msg ai-msg-assistant';
      msgBubble.appendChild(iframe);
      body.appendChild(msgBubble);
      body.scrollTop = body.scrollHeight;
    }
  }

  function parseAndExecuteCommands(text) {
    const setRegex = /\[\[SET:\s*([^=\]]+)=([^\]]+)\]\]/g;
    let match;
    while ((match = setRegex.exec(text)) !== null) {
      const paramId = match[1].trim();
      const value = match[2].trim();
      const el = document.getElementById(paramId);
      if (el) {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    const highlightRegex = /\[\[HIGHLIGHT:\s*([^\]]+)\]\]/g;
    while ((match = highlightRegex.exec(text)) !== null) {
      const elId = match[1].trim();
      const el = document.getElementById(elId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ai-highlight-pulse');
        setTimeout(() => el.classList.remove('ai-highlight-pulse'), 3000);
      }
    }

    const annotateRegex = /\[\[ANNOTATE:\s*([^\]]+)\]\]/g;
    while ((match = annotateRegex.exec(text)) !== null) {
      const msg = match[1].trim();
      const container = document.querySelector('.canvas-column') || document.body;
      const overlay = document.createElement('div');
      overlay.className = 'ai-annotation-overlay';
      overlay.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${msg}`;
      container.appendChild(overlay);
      setTimeout(() => {
        overlay.classList.add('ai-annotation-fade-out');
        setTimeout(() => overlay.remove(), 400);
      }, 5000);
    }

    const profileRegex = /\[\[UPDATE_PROFILE:\s*([^=\]]+)=([^\]]+)\]\]/g;
    while ((match = profileRegex.exec(text)) !== null) {
      _profileManager.update(match[1].trim(), match[2].trim());
    }
  }

  function parseMarkdown(text, isFinal = false) {
    if (!text) return '';
    let thinkContent = '';
    let answerContent = '';

    const thinkMatches = [...text.matchAll(/<think>([\s\S]*?)(?:<\/think>|$)/gi)];
    if (thinkMatches.length > 0) {
      thinkContent = thinkMatches.map(m => m[1].trim()).filter(Boolean).join('\n\n---\n\n');
      answerContent = text.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '').trim();
    } else {
      answerContent = text.trim();
    }

    let processedText = answerContent;

    const mathBlocks = [];
    processedText = processedText.replace(/(\$\$[\s\S]*?\$\$|\$[^$]*?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g, (match) => {
      mathBlocks.push(match);
      return `__MATH_BLOCK_${mathBlocks.length - 1}__`;
    });

    const codeBlocks = [];
    processedText = processedText.replace(/```([\s\S]*?)```/g, (match, p1) => {
      codeBlocks.push(`<pre><code>${p1.trim()}</code></pre>`);
      return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });
    processedText = processedText.replace(/`([^`]+)`/g, (match, p1) => {
      codeBlocks.push(`<code>${p1}</code>`);
      return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });

    processedText = processedText.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    processedText = processedText.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    processedText = processedText.replace(/^# (.*$)/gm, '<h1>$1</h1>');

    processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    processedText = processedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    processedText = processedText.replace(/^[ \t]*[-*][ \t]+(.*)$/gm, '<li>$1</li>');
    processedText = processedText.replace(/(<li>.*?<\/li>(\s*<li>.*?<\/li>)*)/gs, '<ul>$1</ul>');
    processedText = processedText.replace(/<\/ul>\n+/g, '</ul>');
    processedText = processedText.replace(/\n+<ul>/g, '<ul>');

    processedText = processedText.replace(/\n+(?=<(h1|h2|h3|ul|li|pre))/g, '\n');
    processedText = processedText.replace(/(<\/(h1|h2|h3|ul|li|pre)>)\n+/g, '$1\n');

    processedText = processedText.replace(/\n/g, '<br>');

    processedText = processedText.replace(/__CODE_BLOCK_(\d+)__/g, (match, index) => {
      return codeBlocks[parseInt(index, 10)];
    });

    processedText = processedText.replace(/__MATH_BLOCK_(\d+)__/g, (match, index) => {
      return mathBlocks[parseInt(index, 10)];
    });

    let thinkHtml = '';
    if (thinkContent) {
      const lang = document.body.getAttribute('data-active-lang') || 'en';
      let title = 'Thought Process';
      let thinkingMsg = 'Thinking...';
      if (lang === 'ja') { title = '思考プロセス'; thinkingMsg = '考え中...'; }
      if (lang === 'id') { title = 'Proses Berpikir'; thinkingMsg = 'Berpikir...'; }
      
      const isThinkClosed = text.includes('</think>');

      if (!isThinkClosed && !isFinal) {
        thinkHtml = `<div style="margin-bottom:15px; padding-left:15px; border-left:3px solid var(--border1); color:var(--text2);">
          <div style="font-weight:bold; margin-bottom:5px;"><i class="fa-solid fa-brain fa-bounce"></i> ${thinkingMsg}</div>
          <div style="white-space:pre-wrap; opacity:0.8; font-size:0.9em;">${thinkContent}</div>
        </div>`;
      } else {
        thinkHtml = `<details style="margin-bottom:15px; background:var(--bg-layer); border:1px solid var(--border1); border-radius:6px; cursor:pointer; font-size:0.9em;">
          <summary style="padding:8px 12px; font-weight:bold; color:var(--text2); user-select:none;">
            <i class="fa-solid fa-brain"></i> ${title}
          </summary>
          <div style="padding:10px 12px; border-top:1px solid var(--border1); white-space:pre-wrap; color:var(--text2); cursor:text;">${thinkContent}</div>
        </details>`;
      }
    }

    return thinkHtml + processedText;
  }

  function appendMessageUI(role, text) {
    const body = document.getElementById('ai-card-body');
    if (!body) return;
    const msg = document.createElement('div');
    msg.className = 'ai-msg ai-msg-' + role;
    msg.innerHTML = `<p class="${role === 'error' ? 'ai-error' : 'ai-stream-text'}">${
      role === 'error' ? '<i class="fa-solid fa-circle-exclamation"></i> ' : ''
    }${role === 'assistant' ? parseMarkdown(text) : text}</p>`;
    body.appendChild(msg);
    body.scrollTop = body.scrollHeight;
    return msg;
  }

  function cancel() {
    if (_abortCtrl) _abortCtrl.abort();
  }

  function setCardState(state, explainBtn, sendBtn) {
    const spinner = document.getElementById('ai-spinner');
    if (explainBtn) {
      if (state === 'loading' || state === 'streaming') {
        explainBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
        explainBtn.onclick = cancel;
      } else {
        explainBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> <span data-ai-explain-text></span>';
        explainBtn.onclick = () => { if (window.buildAIContext) window.buildAIContext(); };
        updateBtnLabel(explainBtn);
      }
    }
    if (sendBtn) {
      if (state === 'loading' || state === 'streaming') {
        sendBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
        sendBtn.onclick = cancel;
      } else {
        sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
        sendBtn.onclick = handleSend;
      }
    }
    if (spinner) spinner.style.display = (state === 'loading') ? 'inline-block' : 'none';
  }

  function handleSend() {
    if (_isStreaming) {
      cancel();
      return;
    }
    const input = document.getElementById('ai-chat-input');
    if (!input || !input.value.trim()) return;
    
    if (window.buildAIContext) {
      window.buildAIContext(input.value.trim());
    }
  }

  function updateBtnLabel(btn) {
    const lang = document.body.getAttribute('data-active-lang') || 'en';
    const labels = { en: 'Explain', ja: '\u89e3\u8aac\u3059\u308b', id: 'Jelaskan' };
    const span = btn.querySelector('[data-ai-explain-text]');
    if (span) span.textContent = labels[lang] || labels.en;
  }

  function idlePlaceholder() {
    const lang = document.body.getAttribute('data-active-lang') || 'en';
    const hints = {
      en: 'Ask a question, or click <strong>Explain</strong> to have the AI tutor analyze the canvas.',
      ja: '質問するか、<strong>解説する</strong>をクリックするとAIチューターがキャンバスを分析します。',
      id: 'Ajukan pertanyaan, atau klik <strong>Jelaskan</strong> agar tutor AI menganalisis kanvas.',
    };
    return `<p class="ai-placeholder">${hints[lang] || hints.en}</p>`;
  }

  function initSpeech() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return null;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    
    const lang = document.body.getAttribute('data-active-lang') || 'en';
    const localeMap = { en: 'en-US', ja: 'ja-JP', id: 'id-ID' };
    recognition.lang = localeMap[lang] || 'en-US';

    recognition.onresult = (event) => {
      const input = document.getElementById('ai-chat-input');
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      if (input) {
        if (finalTranscript) {
          input.value = (input.dataset.originalText || '') + finalTranscript;
          delete input.dataset.originalText;
        } else {
          if (input.dataset.originalText === undefined) {
             input.dataset.originalText = input.value;
          }
          input.value = input.dataset.originalText + interimTranscript;
        }
      }
    };

    recognition.onerror = () => {
      const micBtn = document.getElementById('ai-mic-btn');
      if (micBtn) micBtn.classList.remove('recording');
    };

    recognition.onend = () => {
      const micBtn = document.getElementById('ai-mic-btn');
      if (micBtn) micBtn.classList.remove('recording');
    };

    return recognition;
  }

  function toggleMic() {
    const micBtn = document.getElementById('ai-mic-btn');
    if (!micBtn) return;
    
    if (micBtn.classList.contains('recording')) {
      if (window._recognition) window._recognition.stop();
      micBtn.classList.remove('recording');
    } else {
      if (!window._recognition) window._recognition = initSpeech();
      if (window._recognition) {
        const lang = document.body.getAttribute('data-active-lang') || 'en';
        const localeMap = { en: 'en-US', ja: 'ja-JP', id: 'id-ID' };
        window._recognition.lang = localeMap[lang] || 'en-US';
        
        window._recognition.start();
        micBtn.classList.add('recording');
      } else {
        alert("Speech recognition is not supported in your browser.");
      }
    }
  }

  function renderCard(canvasColumnId) {
    const col = document.getElementById(canvasColumnId);
    if (!col || document.getElementById('ai-card-wrapper')) return;

    const card = document.createElement('div');
    card.id = 'ai-card-wrapper';
    card.className = 'ai-card ai-card--idle';
    card.innerHTML = `
      <div class="ai-card-header">
        <span class="ai-badge">
          <i class="fa-solid fa-sparkles"></i>
          <span>
            <span data-lang="en">AI Tutor</span>
            <span data-lang="ja">AIチューター</span>
            <span data-lang="id">Tutor AI</span>
          </span>
        </span>
        <span class="ai-model-tag" style="display: inline-flex; align-items: center; gap: 4px; font-family: ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', Segoe UI Symbol, 'Noto Color Emoji'; font-weight: 700; letter-spacing: -0.02em; color: #e02020;">
          <a href="https://labs.dahono.com" target="_blank"><img class="dahono-logo" src="${window.isDark && window.isDark() ? 'dahono-labs-logo-white.svg' : 'dahono-labs-logo-black.svg'}" alt="Dahono Labs" style="height: 2em; width: auto; border-radius: 2px;"></a>
        </span>
        <div class="ai-header-actions">
          <button id="ai-draw-btn" class="ai-draw-btn" onclick="AIMathTutor.toggleDrawMode()">
            <i class="fa-solid fa-pen"></i> <span data-lang="en">Draw</span><span data-lang="ja">描画</span><span data-lang="id">Gambar</span>
          </button>
          <button id="ai-speaker-btn" class="ai-speaker-btn" onclick="AIMathTutor.toggleTTS()">
            <i class="fa-solid fa-volume-high"></i>
          </button>
          <button id="ai-quiz-btn" class="ai-quiz-btn" onclick="AIMathTutor.toggleQuizMode()">
            <i class="fa-solid fa-clipboard-question"></i> <span data-lang="en">Quiz</span><span data-lang="ja">クイズ</span><span data-lang="id">Kuis</span>
          </button>
          <button id="ai-clear-btn" class="ai-clear-btn" onclick="AIMathTutor.clearHistory(); AIMathTutor.clearDrawLayer();">
            <i class="fa-solid fa-trash-can"></i>
          </button>
          <span id="ai-spinner" class="ai-spinner" style="display:none"></span>
          <button id="ai-explain-btn" class="ai-explain-btn" onclick="if(window.buildAIContext) window.buildAIContext();">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            <span data-ai-explain-text></span>
          </button>
        </div>
      </div>
      <div class="ai-card-body" id="ai-card-body">${idlePlaceholder()}</div>
      <div class="ai-chat-bar">
        <button id="ai-mic-btn" class="ai-mic-btn" onclick="AIMathTutor.toggleMic()"><i class="fa-solid fa-microphone"></i></button>
        <input type="text" id="ai-chat-input" class="ai-chat-input" onkeydown="if(event.key === 'Enter') document.getElementById('ai-send-btn').click();">
        <button id="ai-send-btn" class="ai-send-btn" onclick="AIMathTutor.handleSend()"><i class="fa-solid fa-paper-plane"></i></button>
      </div>
    `;
    col.appendChild(card);
    
    window.AIMathTutor.toggleMic = toggleMic;
    window.AIMathTutor.handleSend = handleSend;

    const updateTranslations = () => {
      const lang = document.body.getAttribute('data-active-lang') || 'en';
      const titles = {
        en: { draw: 'Toggle Whiteboard Mode', voice: 'Toggle Voice Output', quiz: 'Toggle Quiz Mode', clear: 'Clear Chat & Drawing', placeholder: 'Ask a question...' },
        ja: { draw: 'ホワイトボードモードを切り替え', voice: '音声出力を切り替え', quiz: 'クイズモードを切り替え', clear: 'チャットと描画をクリア', placeholder: '質問を入力してください...' },
        id: { draw: 'Alihkan Mode Papan Tulis', voice: 'Alihkan Output Suara', quiz: 'Alihkan Mode Kuis', clear: 'Hapus Obrolan & Gambar', placeholder: 'Ajukan pertanyaan...' }
      };
      const t = titles[lang] || titles.en;
      document.getElementById('ai-draw-btn')?.setAttribute('title', t.draw);
      document.getElementById('ai-speaker-btn')?.setAttribute('title', t.voice);
      document.getElementById('ai-quiz-btn')?.setAttribute('title', t.quiz);
      document.getElementById('ai-clear-btn')?.setAttribute('title', t.clear);
      document.getElementById('ai-chat-input')?.setAttribute('placeholder', t.placeholder);

      document.querySelectorAll('[data-lang]').forEach(el => {
        el.style.display = (el.getAttribute('data-lang') === lang) ? '' : 'none';
      });
    };

    updateTranslations();

    const observer = new MutationObserver(() => {
      const btn = document.getElementById('ai-explain-btn');
      if (btn && !_isStreaming) updateBtnLabel(btn);
      const body = document.getElementById('ai-card-body');
      if (body && _chatHistory.length === 0 && body.querySelector('.ai-placeholder')) {
        body.innerHTML = idlePlaceholder();
      }
      updateTranslations();
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-active-lang'] });

    updateBtnLabel(document.getElementById('ai-explain-btn'));
  }

  window.buildAIMessages = function (pageName, contextLines) {
    const lang = document.body.getAttribute('data-active-lang') || 'en';
    const langInstructions = {
      en: 'CRITICAL: You MUST respond entirely in English.',
      ja: 'CRITICAL: You MUST respond entirely in Japanese (\u65e5\u672c\u8a9e\u3067\u56de\u7b54\u3057\u3066\u304f\u3060\u3055\u3044).',
      id: 'SANGAT PENTING: Anda DIWAJIBKAN menjawab sepenuhnya dalam Bahasa Indonesia. JANGAN gunakan bahasa Inggris.',
    };

    const system = [
      `You are an expert math and AI tutor integrated into "AIMathLab", an interactive web-based visualizer.`,
      `AIMathLab's goal is to build deep mathematical intuition for Artificial Intelligence concepts.`,
      `The project contains 5 main interactive modules:`,
      `1. Vectors: Explores dot products, cosine similarity, and vector projections (foundational for Word Embeddings & Attention).`,
      `2. Matrices: Visualizes linear transformations, stretching, and rotating space (foundational for Neural Network Weights & SVD).`,
      `3. Calculus: Demonstrates gradient descent on a loss landscape (foundational for Model Optimization).`,
      `4. Probability: Shows data distributions and variance (foundational for initialization and generative models).`,
      `5. Neural Networks: Simulates a multilayer perceptron, showing forward passes and backpropagation.`,
      `Additional features: Trilingual support (EN, JA, ID), Dark/Light theme toggle, and a Scientific Methodology Docs page.`,
      `You must act as a knowledgeable, encouraging guide who truly understands the holistic purpose of this project: bridging the gap between abstract equations and visual understanding in AI.`,
      `The user is currently on the "${pageName}" module.`,
      `Here is the exact live state of the visualizer right now (which the user is interacting with via sliders):`,
      ...contextLines.map(l => `  - ${l}`),
      ``,
      `Task: Answer the user's question or explain the current canvas state.`,
      `Connect the specific numbers/state they are seeing to the broader concepts of Artificial Intelligence or Machine Learning where applicable.`,
      `Be concise, highly insightful, and encourage further exploration. You can use LaTeX math formatting by wrapping inline math in $...$ and block math in $$...$$.`,
      `You have access to native tools. ALWAYS use tool calls when you need to interact with the visualizer UI (set_parameter, highlight_element, annotate) or update the user's learning profile (update_profile).`,
      `DO NOT use the old text-based [[SET:...]] commands anymore. Rely purely on the tools array.`,
      `If you need to show a dynamic or interactive element inside the chat, use the render_custom_ui tool.`,
      `CRITICAL RULE: You MUST ALWAYS provide a helpful text explanation of what you are doing alongside any tool calls. Do NOT just silently call tools.`,
      `CRITICAL RULE: Your final explanation MUST be written OUTSIDE of any <think> tags so the user can read it.`,
      ``,
      `User Learning Profile State: __PROFILE_PLACEHOLDER__`,
      `Adapt your explanations to match their proficiency.`,
      langInstructions[lang] || langInstructions.en,
    ].join('\n');

    return [{ role: 'system', content: system }];
  };

})();
