(function () {
  'use strict';

  const motionQuery = '(min-width: 880px) and (min-height: 610px) and (prefers-reduced-motion: no-preference)';
  let dispose = () => {};

  function addControls(heading, cards, goTo) {
    const element = document.createElement('div');
    element.className = 'ds-process-controls';
    element.hidden = true;

    const current = document.createElement('span');
    current.className = 'ds-process-current';
    const pagination = document.createElement('div');
    pagination.className = 'ds-process-pagination';
    pagination.setAttribute('role', 'group');
    pagination.setAttribute('aria-label', 'Choose a process step');

    const buttons = cards.map((card, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ds-process-page';
      const title = card.querySelector('h3');
      button.setAttribute('aria-label', `Step ${index + 1}: ${title?.textContent.trim() || 'Process details'}`);
      if (title?.id) button.setAttribute('aria-controls', title.id);
      button.addEventListener('click', () => goTo(index));
      pagination.append(button);
      return button;
    });

    element.append(current, pagination);
    heading.append(element);
    return { element, current, buttons };
  }

  function mount(root) {
    dispose();
    dispose = () => {};

    const stack = root?.querySelector('[data-editorial-stack]');
    const section = stack?.closest('#our-process');
    const heading = section?.querySelector('.ds-process-heading');
    if (!section || !heading || typeof window.matchMedia !== 'function') return;

    const cards = [...stack.children].filter(card => card.classList.contains('ds-process-card'));
    if (cards.length < 2) return;

    const media = window.matchMedia(motionQuery);
    const header = document.getElementById('ds-main-header');
    const depths = [];
    let geometry;
    let animationFrame = 0;
    let layoutDirty = true;
    let disposed = false;
    let currentStep = -1;

    const controls = addControls(heading, cards, goTo);
    cards.forEach((card, index) => card.style.setProperty('--ds-swap-order', String(index + 1)));

    function setDepth(index, depth) {
      const rounded = Math.round(depth * 1000) / 1000;
      if (depths[index] === rounded) return;
      depths[index] = rounded;
      const { style } = cards[index];
      if (rounded === 0) {
        style.removeProperty('--ds-swap-recess');
        style.removeProperty('--ds-swap-scale');
        return;
      }
      style.setProperty('--ds-swap-recess', `${-14 * rounded}px`);
      style.setProperty('--ds-swap-scale', String(1 - .047 * rounded));
    }

    function clearLayout() {
      geometry = undefined;
      section.removeAttribute('data-card-swap-active');
      section.style.removeProperty('--ds-swap-height');
      section.style.removeProperty('--ds-swap-top');
      controls.element.hidden = true;
      cards.forEach((_, index) => setDepth(index, 0));
    }

    function measureLayout() {
      layoutDirty = false;
      if (!media.matches || !stack.isConnected) {
        clearLayout();
        return;
      }

      const pin = (header?.offsetHeight || 72) + 22;
      // Measure each card at its natural height before equalizing the visual stack.
      section.style.removeProperty('--ds-swap-height');
      const height = Math.max(...cards.map(card => card.offsetHeight));
      const headingHeight = heading.offsetHeight + (controls.element.hidden ? 84 : 0);
      if (!height || pin + Math.max(height, headingHeight) > window.innerHeight - 28) {
        clearLayout();
        return;
      }

      section.toggleAttribute('data-card-swap-active', true);
      section.style.setProperty('--ds-swap-height', `${height}px`);
      section.style.setProperty('--ds-swap-top', `${pin}px`);
      controls.element.hidden = false;

      const gap = Number.parseFloat(getComputedStyle(stack).rowGap) || 0;
      const start = stack.getBoundingClientRect().top + window.scrollY - pin;
      // Sticky children report their shifted bounding boxes. Calculate their
      // anchors from normal-flow sizes and the gap instead.
      let offset = 0;
      const positions = cards.map(card => {
        const position = offset;
        offset += card.offsetHeight + gap;
        return position;
      });
      geometry = { start, positions, height };
    }

    function updateControls(index) {
      if (currentStep === index) return;
      if (currentStep >= 0) controls.buttons[currentStep].removeAttribute('aria-current');
      controls.buttons[index].setAttribute('aria-current', 'step');
      controls.current.textContent = `Step ${index + 1} of ${cards.length}`;
      currentStep = index;
    }

    function render() {
      animationFrame = 0;
      if (layoutDirty) measureLayout();
      if (!geometry) return;

      const { start, positions, height } = geometry;
      const passed = Math.max(0, window.scrollY - start);
      let leading = positions.length - 1;
      while (leading > 0 && passed < positions[leading]) leading -= 1;

      const incomingDistance = (positions[leading + 1] ?? Infinity) - passed;
      const overlap = Math.max(0, Math.min(1, 1 - incomingDistance / height));
      const easing = overlap * overlap * (3 - 2 * overlap);

      cards.forEach((_, index) => setDepth(index, index < leading ? 1 : index === leading ? easing : 0));
      updateControls(overlap >= .6 ? leading + 1 : leading);
    }

    function requestRender() {
      if (!disposed && !animationFrame) animationFrame = window.requestAnimationFrame(render);
    }

    function invalidateLayout() {
      layoutDirty = true;
      requestRender();
    }

    function goTo(index) {
      if (layoutDirty) measureLayout();
      if (!geometry) return;
      window.scrollTo({ top: geometry.start + geometry.positions[index] + 1, behavior: 'smooth' });
    }

    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(invalidateLayout) : null;
    observer?.observe(root);
    observer?.observe(stack);
    if (header) observer?.observe(header);
    document.fonts?.ready.then(() => !disposed && invalidateLayout());
    root.addEventListener('load', invalidateLayout, true);
    window.addEventListener('resize', invalidateLayout);
    window.addEventListener('scroll', requestRender, { passive: true });
    media.addEventListener('change', invalidateLayout);
    requestRender();

    dispose = () => {
      disposed = true;
      observer?.disconnect();
      root.removeEventListener('load', invalidateLayout, true);
      window.removeEventListener('resize', invalidateLayout);
      window.removeEventListener('scroll', requestRender);
      media.removeEventListener('change', invalidateLayout);
      window.cancelAnimationFrame(animationFrame);
      clearLayout();
      cards.forEach(card => card.style.removeProperty('--ds-swap-order'));
      controls.element.remove();
    };
  }

  window.DS_CARD_SWAP = { mount };
})();
