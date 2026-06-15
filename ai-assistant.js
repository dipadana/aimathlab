(function () {
  'use strict';

  let _isStreaming = false;
  let _abortCtrl = null;

  window.AIMathTutor = {
    ask,
    cancel,
    isStreaming: () => _isStreaming,
    renderCard,
  };

  async function ask(messages, cardId) {
    if (_isStreaming) cancel();

    const card = document.getElementById(cardId);
    const btn = document.getElementById('ai-explain-btn');
    const spinner = document.getElementById('ai-spinner');
    if (!card) return;

    _isStreaming = true;
    _abortCtrl = new AbortController();

    setCardState('loading', cardId, btn, spinner);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, stream: true }),
        signal: _abortCtrl.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        setCardState('error', cardId, btn, spinner, err.error || 'API error');
        _isStreaming = false;
        return;
      }

      setCardState('streaming', cardId, btn, spinner);
      card.innerHTML = '';

      const textEl = document.createElement('p');
      textEl.className = 'ai-stream-text';
      card.appendChild(textEl);

      const cursor = document.createElement('span');
      cursor.className = 'ai-cursor';
      cursor.textContent = '\u258c';
      textEl.appendChild(cursor);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

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
              setCardState('error', cardId, btn, spinner, 'The AI gateway is temporarily unavailable. Please try again.');
              _isStreaming = false;
              _abortCtrl = null;
              return;
            }
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              textEl.insertBefore(document.createTextNode(delta), cursor);
            }
          } catch {}
        }
      }

      cursor.remove();
      setCardState('done', cardId, btn, spinner);

    } catch (e) {
      if (e.name === 'AbortError') {
        setCardState('idle', cardId, btn, spinner);
      } else {
        setCardState('error', cardId, btn, spinner, 'Connection failed. Check your network.');
      }
    } finally {
      _isStreaming = false;
      _abortCtrl = null;
    }
  }

  function cancel() {
    if (_abortCtrl) _abortCtrl.abort();
  }

  function setCardState(state, cardId, btn, spinner, errorMsg) {
    const card = document.getElementById(cardId);
    const wrapper = document.getElementById('ai-card-wrapper');
    if (!wrapper) return;

    wrapper.className = 'ai-card ai-card--' + state;

    if (btn) {
      if (state === 'loading' || state === 'streaming') {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-stop"></i> Stop';
        btn.onclick = cancel;
      } else {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> <span data-ai-explain-text></span>';
        btn.onclick = () => { if (window.buildAIContext) window.buildAIContext(); };
        updateBtnLabel(btn);
      }
    }

    if (spinner) spinner.style.display = (state === 'loading') ? 'inline-block' : 'none';

    if (state === 'error' && card) {
      card.innerHTML = `<p class="ai-error"><i class="fa-solid fa-circle-exclamation"></i> ${errorMsg}</p>`;
    }
    if (state === 'idle' && card) {
      card.innerHTML = idlePlaceholder();
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
      en: 'Click <strong>Explain</strong> and the AI tutor will analyse what you\'re seeing on the canvas and teach you the concept.',
      ja: '<strong>\u89e3\u8aac\u3059\u308b</strong>\u3092\u30af\u30ea\u30c3\u30af\u3059\u308b\u3068\u3001AI\u30c1\u30e5\u30fc\u30bf\u30fc\u304c\u30ad\u30e3\u30f3\u30d0\u30b9\u306e\u5185\u5bb9\u3092\u5206\u6790\u3057\u3066\u6982\u5ff5\u3092\u6559\u3048\u3066\u304f\u308c\u307e\u3059\u3002',
      id: 'Klik <strong>Jelaskan</strong> dan tutor AI akan menganalisis apa yang Anda lihat di kanvas dan mengajarkan konsepnya.',
    };
    return `<p class="ai-placeholder">${hints[lang] || hints.en}</p>`;
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
        <span class="ai-model-tag">claude-opus-4.8</span>
        <div class="ai-header-actions">
          <span id="ai-spinner" class="ai-spinner" style="display:none"></span>
          <button id="ai-explain-btn" class="ai-explain-btn" onclick="if(window.buildAIContext) window.buildAIContext();">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            <span data-ai-explain-text></span>
          </button>
        </div>
      </div>
      <div class="ai-card-body" id="ai-card-body">${idlePlaceholder()}</div>
    `;
    col.appendChild(card);

    const observer = new MutationObserver(() => {
      const btn = document.getElementById('ai-explain-btn');
      if (btn && !_isStreaming) updateBtnLabel(btn);
      const body = document.getElementById('ai-card-body');
      if (body && body.querySelector('.ai-placeholder')) {
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
      `Task: In 3-5 sentences, explain what the user is currently seeing on the canvas and teach the key mathematical concept behind it.`,
      `Connect the specific numbers/state they are seeing to the broader concepts of Artificial Intelligence or Machine Learning where applicable.`,
      `Be concise, highly insightful, and encourage further exploration. Plain text only, no markdown, no LaTeX, no bullet points.`,
      langInstructions[lang] || langInstructions.en,
    ].join('\n');

    return [{ role: 'user', content: system }];
  };

})();
