(function () {
  'use strict';

  let _isStreaming = false;
  let _abortCtrl = null;
  let _chatHistory = [];
  let _isQuizMode = false;

  window.AIMathTutor = {
    ask, // called when clicking Explain or Send
    cancel,
    isStreaming: () => _isStreaming,
    renderCard,
    toggleQuizMode,
    clearHistory
  };

  function toggleQuizMode() {
    _isQuizMode = !_isQuizMode;
    const btn = document.getElementById('ai-quiz-btn');
    if (btn) btn.classList.toggle('active', _isQuizMode);
    clearHistory();
    // Auto-trigger an explain to start the quiz
    if (window.buildAIContext) window.buildAIContext();
  }

  function clearHistory() {
    _chatHistory = [];
    const body = document.getElementById('ai-card-body');
    if (body) body.innerHTML = idlePlaceholder();
  }

  // ask receives the system context messages from buildAIContext
  async function ask(systemContextMsgs, cardId, userMessage = null) {
    if (_isStreaming) cancel();

    const card = document.getElementById(cardId);
    const body = document.getElementById('ai-card-body');
    const inputField = document.getElementById('ai-chat-input');
    const explainBtn = document.getElementById('ai-explain-btn');
    const sendBtn = document.getElementById('ai-send-btn');
    
    if (!body) return;

    // Clear placeholder if first message
    if (body.querySelector('.ai-placeholder')) {
      body.innerHTML = '';
    }

    _isStreaming = true;
    _abortCtrl = new AbortController();

    // Setup UI for loading
    setCardState('loading', explainBtn, sendBtn);

    // If it's a user message, add it to history and UI
    if (userMessage) {
      _chatHistory.push({ role: 'user', content: userMessage });
      appendMessageUI('user', userMessage);
      if (inputField) inputField.value = '';
    } else {
      // If it's just "Explain", we pass a default instruction to the model
      const lang = document.body.getAttribute('data-active-lang') || 'en';
      const defaultReq = {
        en: _isQuizMode ? 'Please give me a quiz challenge based on this.' : 'Please explain what I am seeing.',
        ja: _isQuizMode ? 'これに基づいたクイズを出してください。' : '見ている内容を説明してください。',
        id: _isQuizMode ? 'Tolong berikan saya kuis berdasarkan ini.' : 'Tolong jelaskan apa yang saya lihat.'
      };
      _chatHistory.push({ role: 'user', content: defaultReq[lang] });
      // We don't necessarily show the default "Explain" text in UI, or maybe we do to make it clear.
      appendMessageUI('user', defaultReq[lang]);
    }

    // Construct final payload
    // systemContextMsgs usually contains the system prompt pretending to be 'user' (for models that only support user)
    // We'll map systemContextMsgs to system, and append history.
    let payloadMessages = [];
    if (systemContextMsgs && systemContextMsgs.length > 0) {
      // Convert the context into a true system prompt
      payloadMessages.push({ role: 'system', content: systemContextMsgs[0].content });
    }
    
    // Add quiz mode instruction if active
    if (_isQuizMode) {
      payloadMessages[0].content += `\n\nQUIZ MODE ACTIVE: Act as an examiner. Do NOT explain the math directly. Instead, give the user a specific challenge to complete by adjusting the visualizer parameters. When they ask to check their answer, evaluate their success based on the live visualizer state provided in the context.`;
    }

    payloadMessages = payloadMessages.concat(_chatHistory);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payloadMessages, stream: true }),
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

      // Create AI response bubble
      const msgBubble = document.createElement('div');
      msgBubble.className = 'ai-msg ai-msg-assistant';
      const textEl = document.createElement('p');
      textEl.className = 'ai-stream-text';
      msgBubble.appendChild(textEl);
      body.appendChild(msgBubble);

      const cursor = document.createElement('span');
      cursor.className = 'ai-cursor';
      cursor.textContent = '\u258c';
      textEl.appendChild(cursor);

      body.scrollTop = body.scrollHeight;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';

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
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              fullResponse += delta;
              
              // We want to hide [[SET: param=value]] from the user UI while streaming if possible,
              // but for simplicity, we'll strip it out of the displayed text dynamically.
              const displayableText = fullResponse.replace(/\[\[SET:\s*([^=\]]+)=([^\]]+)\]\]/g, '');
              
              textEl.textContent = displayableText;
              textEl.appendChild(cursor);
              body.scrollTop = body.scrollHeight;
            }
          } catch {}
        }
      }

      cursor.remove();
      _chatHistory.push({ role: 'assistant', content: fullResponse });
      
      // Parse structured commands: [[SET: param=value]]
      parseAndExecuteCommands(fullResponse);

      setCardState('idle', explainBtn, sendBtn);

    } catch (e) {
      if (e.name !== 'AbortError') {
        appendMessageUI('error', 'Connection failed. Check your network.');
      }
      setCardState('idle', explainBtn, sendBtn);
    } finally {
      _isStreaming = false;
      _abortCtrl = null;
    }
  }

  function parseAndExecuteCommands(text) {
    const regex = /\[\[SET:\s*([^=\]]+)=([^\]]+)\]\]/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const paramId = match[1].trim();
      const value = match[2].trim();
      const el = document.getElementById(paramId);
      if (el) {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }

  function appendMessageUI(role, text) {
    const body = document.getElementById('ai-card-body');
    if (!body) return;
    const msg = document.createElement('div');
    msg.className = 'ai-msg ai-msg-' + role;
    msg.innerHTML = `<p class="${role === 'error' ? 'ai-error' : 'ai-stream-text'}">${
      role === 'error' ? '<i class="fa-solid fa-circle-exclamation"></i> ' : ''
    }${text}</p>`;
    body.appendChild(msg);
    body.scrollTop = body.scrollHeight;
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
    
    // Call the original context builder but pass our user message
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

  // Web Speech API
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
        // If there's final transcript, append it to whatever was typed
        if (finalTranscript) {
          input.value = (input.dataset.originalText || '') + finalTranscript;
          delete input.dataset.originalText;
        } else {
          // just show interim
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
        // Update language
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
          <span>AI Tutor</span>
        </span>
        <span class="ai-model-tag" style="display: inline-flex; align-items: center; gap: 4px; font-family: ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', Segoe UI Symbol, 'Noto Color Emoji'; font-weight: 700; letter-spacing: -0.02em;">
          <img src="dahono_logo.svg" alt="Dahono Labs" style="height: 1em; width: auto; border-radius: 2px;"> Dahono Labs.
        </span>
        <div class="ai-header-actions">
          <button id="ai-quiz-btn" class="ai-quiz-btn" onclick="AIMathTutor.toggleQuizMode()" title="Toggle Quiz Mode">
            <i class="fa-solid fa-clipboard-question"></i> Quiz
          </button>
          <button id="ai-clear-btn" class="ai-clear-btn" onclick="AIMathTutor.clearHistory()" title="Clear Chat">
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
        <input type="text" id="ai-chat-input" class="ai-chat-input" placeholder="Ask a question..." onkeydown="if(event.key === 'Enter') document.getElementById('ai-send-btn').click();">
        <button id="ai-send-btn" class="ai-send-btn" onclick="AIMathTutor.handleSend()"><i class="fa-solid fa-paper-plane"></i></button>
      </div>
    `;
    col.appendChild(card);
    
    // Bind functions for the inline onclick handlers since they reference AIMathTutor
    window.AIMathTutor.toggleMic = toggleMic;
    window.AIMathTutor.handleSend = handleSend;

    const observer = new MutationObserver(() => {
      const btn = document.getElementById('ai-explain-btn');
      if (btn && !_isStreaming) updateBtnLabel(btn);
      const body = document.getElementById('ai-card-body');
      if (body && _chatHistory.length === 0 && body.querySelector('.ai-placeholder')) {
        body.innerHTML = idlePlaceholder();
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-active-lang'] });

    updateBtnLabel(document.getElementById('ai-explain-btn'));
  }

  window.buildAIMessages = function (pageName, contextLines) {
    const lang = document.body.getAttribute('data-active-lang') || 'en';
    const langInstructions = {
      en: 'Respond in English.',
      ja: '\u65e5\u672c\u8a9e\u3067\u56de\u7b54\u3057\u3066\u304f\u3060\u3055\u3044\u3002',
      id: 'Jawab dalam Bahasa Indonesia.',
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
      `Be concise, highly insightful, and encourage further exploration. Plain text only, no markdown, no LaTeX.`,
      `IMPORTANT PARAMETER CONTROL: You have the ability to physically control the sliders on the user's screen! If the user asks you to demonstrate something (e.g. "show me an exploding gradient"), or if you think a demonstration is helpful, you can append structured commands to your response.`,
      `To set a slider, include the exact syntax [[SET: parameter_id=value]] at the end of your response. For example: [[SET: gdLR=2.5]]. The client will automatically parse this and adjust the visualizer live!`,
      `Known parameter IDs for the current module will be included in the context lines if available.`,
      langInstructions[lang] || langInstructions.en,
    ].join('\n');

    return [{ role: 'system', content: system }];
  };

})();
