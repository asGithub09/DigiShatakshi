(function installDigiSaathi(global) {
  'use strict';

  const advisor = document.getElementById('ds-advisor');
  const answers = global.DigiSaathiAnswers;
  if (!advisor || !answers) return;

  const launcher = document.getElementById('ds-advisor-launcher');
  const panel = document.getElementById('ds-advisor-panel');
  const closeButton = document.getElementById('ds-advisor-close');
  const transcript = document.getElementById('ds-chat-scroll');
  const messages = document.getElementById('ds-chat-messages');
  const input = document.getElementById('ds-chat-input');
  const form = document.getElementById('ds-chat-form');
  const quick = document.getElementById('ds-chat-quick');
  const typing = document.getElementById('ds-chat-typing');
  const typingLabel = document.getElementById('ds-chat-typing-label');
  const promo = document.getElementById('ds-christmas-promo');
  const promoSeenKey = 'ds-christmas-promo-seen-v2';
  const conversation = answers.createConversation(global.DS_SERVICE_PRICING_CONTENT);
  const pending = [];
  const typingText = {
    en: 'DigiSaathi is typing…',
    hi: 'DigiSaathi जवाब लिख रहा है…',
    'hi-Latn': 'DigiSaathi jawab likh raha hai…'
  };

  let greeted = false;
  let replying = false;
  let promoTimer;
  let promoSeen = false;
  let lastQuoteDraft = '';

  function scrollToLatest() {
    transcript.scrollTop = transcript.scrollHeight;
  }

  function updateViewport() {
    const viewport = global.visualViewport;
    if (!viewport) return;
    const inset = Math.max(0, global.innerHeight - viewport.height - viewport.offsetTop);
    advisor.style.setProperty('--dsch-viewport-height', Math.round(viewport.height) + 'px');
    advisor.style.setProperty('--dsch-keyboard-inset', Math.round(inset) + 'px');
  }

  function openChat() {
    hidePromo();
    panel.hidden = false;
    advisor.classList.add('is-open');
    launcher.setAttribute('aria-expanded', 'true');
    updateViewport();
    const focusTarget = global.matchMedia('(pointer: fine)').matches ? input : closeButton;
    focusTarget.focus({ preventScroll: true });
    scrollToLatest();
    if (greeted) return;
    greeted = true;
    enqueue({ greeting: answers.greeting() });
  }

  function closeChat() {
    panel.hidden = true;
    advisor.classList.remove('is-open');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus({ preventScroll: true });
    schedulePromo();
  }

  function openQuote(action, sourcePrompt) {
    if (typeof global.dsOpenQuoteModal !== 'function') return;
    closeChat();
    const requirements = document.getElementById('ds-q-message');
    if (requirements && sourcePrompt && (!requirements.value.trim() || requirements.value === lastQuoteDraft)) {
      lastQuoteDraft = sourcePrompt;
      requirements.value = lastQuoteDraft;
    }
    const select = document.getElementById('ds-q-service');
    if (select && !action.service) select.value = '';
    global.dsOpenQuoteModal(action.service || '', action.plan || '');
  }

  function whatsAppLink(action) {
    const topic = action.plan || action.service;
    const message = topic
      ? 'Hi Digi Shatakshi, I would like to speak to your team about ' + topic + '.'
      : 'Hi Digi Shatakshi, I was chatting with DigiSaathi and would like to speak to your team.';
    return 'https://wa.me/917310251337?text=' + encodeURIComponent(message);
  }

  function createAction(action, sourcePrompt) {
    if (action.type === 'prompt' || action.type === 'quote') {
      const button = document.createElement('button');
      button.type = 'button';
      button.addEventListener('click', () => {
        if (action.type === 'quote') openQuote(action, sourcePrompt);
        else send(action.prompt || action.label, action.hint);
      });
      return button;
    }

    const link = document.createElement('a');
    if (action.type === 'whatsapp') {
      link.href = whatsAppLink(action);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      return link;
    }

    if (action.type === 'pricing') {
      link.href = '/pricing' + (action.slug ? '?service=' + encodeURIComponent(action.slug) : '');
    } else if (action.type === 'service' && /^\/(?:services|service-[a-z-]+)$/.test(action.route)) {
      link.href = action.route;
    } else {
      return null;
    }

    link.addEventListener('click', event => {
      if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (typeof global.navigateTo !== 'function') return;
      if (action.type === 'pricing' && action.slug) {
        const navigateToService = global.DS_SERVICE_PRICING_PAGE?.navigateToService;
        if (!navigateToService) return;
        navigateToService(action.slug);
      } else {
        global.navigateTo(link.pathname.slice(1));
      }
      event.preventDefault();
      closeChat();
    });
    return link;
  }

  function appendMessage(reply, isUser = false, sourcePrompt = '') {
    const turn = document.createElement('div');
    turn.className = 'ds-chat-turn' + (isUser ? ' is-user' : '');
    if (reply.language) turn.lang = reply.language;
    const bubble = document.createElement('p');
    bubble.className = 'ds-chat-message';
    bubble.textContent = reply.text;
    turn.append(bubble);

    if (reply.actions?.length) {
      const actions = document.createElement('div');
      actions.className = 'ds-chat-actions';
      for (const action of reply.actions) {
        const control = createAction(action, sourcePrompt);
        if (!control) continue;
        control.className = 'ds-chat-action';
        control.dataset.action = action.type;
        control.textContent = action.label;
        actions.append(control);
      }
      if (actions.childElementCount) turn.append(actions);
    }
    messages.append(turn);
    scrollToLatest();
  }

  function nextReply() {
    if (replying || !pending.length) return;
    replying = true;
    const { greeting, text, hint } = pending.shift();
    const reply = greeting
      ? { text: greeting, language: 'en' }
      : conversation.respond(text, hint);
    if (text) appendMessage({ text, language: reply.language }, true);

    typing.hidden = false;
    typingLabel.lang = reply.language;
    typingLabel.textContent = typingText[reply.language] || typingText.en;
    scrollToLatest();

    const delay = greeting ? 500 : Math.min(1400, 560 + reply.text.length * 1.8);
    global.setTimeout(() => {
      typingLabel.textContent = '';
      typing.hidden = true;
      appendMessage(reply, false, text);
      replying = false;
      nextReply();
    }, delay);
  }

  function enqueue(turn) {
    pending.push(turn);
    nextReply();
  }

  function send(value, hint) {
    const text = value.trim();
    if (!text) return false;
    enqueue({ text, hint });
    return true;
  }

  function hasSeenPromo() {
    if (promoSeen) return true;
    try {
      return global.sessionStorage.getItem(promoSeenKey) === '1';
    } catch {
      return false;
    }
  }

  function markPromoSeen() {
    promoSeen = true;
    try {
      global.sessionStorage.setItem(promoSeenKey, '1');
    } catch {
      // The chat still works when the browser blocks session storage.
    }
  }

  function hidePromo() {
    global.clearTimeout(promoTimer);
    if (!promo) return;
    promo.classList.remove('is-visible');
    promo.setAttribute('aria-hidden', 'true');
    promo.setAttribute('inert', '');
  }

  function hasBlockingOverlay() {
    return !!document.querySelector(
      '#ds-entry-scene:not(.is-gone), #ds-quote-modal.is-open, #booking-modal:not(.hidden), #blog-modal:not(.hidden), .modal:not(.hidden)'
    );
  }

  function dismissPromo(restoreFocus) {
    markPromoSeen();
    hidePromo();
    if (restoreFocus) launcher.focus({ preventScroll: true });
  }

  function schedulePromo(delay = 5500) {
    global.clearTimeout(promoTimer);
    if (!promo || hasSeenPromo() || !panel.hidden || document.hidden) return;
    promoTimer = global.setTimeout(() => {
      if (!panel.hidden || document.hidden || hasSeenPromo()) return;
      if (hasBlockingOverlay()) {
        schedulePromo(1500);
        return;
      }
      promo.removeAttribute('inert');
      promo.setAttribute('aria-hidden', 'false');
      promo.classList.add('is-visible');
      markPromoSeen();
    }, delay);
  }

  launcher.addEventListener('click', () => panel.hidden ? openChat() : closeChat());
  closeButton.addEventListener('click', closeChat);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (send(input.value)) input.value = '';
  });
  quick.addEventListener('click', event => {
    const button = event.target.closest('button[data-chat]');
    if (button) send(button.querySelector('span').textContent, button.dataset.chat);
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (!panel.hidden) closeChat();
    else if (promo?.classList.contains('is-visible') && !hasBlockingOverlay()) {
      dismissPromo(promo.contains(document.activeElement));
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !hasSeenPromo()) schedulePromo();
  });
  global.visualViewport?.addEventListener('resize', () => {
    if (panel.hidden) return;
    updateViewport();
    if (document.activeElement === input) scrollToLatest();
  });
  global.visualViewport?.addEventListener('scroll', updateViewport);

  promo?.querySelector('.ds-promo-close')?.addEventListener('click', () => {
    dismissPromo(true);
  });
  promo?.querySelector('.ds-promo-primary')?.addEventListener('click', () => {
    markPromoSeen();
    openChat();
    send('Christmas offer', 'promo');
  });
  global.dsHideChristmasPromo = hidePromo;
  global.dsScheduleChristmasPromo = schedulePromo;
  schedulePromo();
})(window);
