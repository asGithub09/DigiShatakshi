(function (global) {
  'use strict';

  const testimonials = [
    {
      name: 'Rohan Srivastava',
      initials: 'RS',
      role: 'Real Estate Developer, Lucknow',
      quote: 'Digi Shatakshi restructured our landing pages and Google Ads, doubling our qualified site-visit inquiries within two months.'
    },
    {
      name: 'Dr. Neha Verma',
      initials: 'NV',
      role: 'Healthcare & Wellness Clinic',
      quote: 'Their local SEO strategy placed our clinic in top Lucknow search results, bringing consistent organic patient appointments.'
    },
    {
      name: 'Amitabh Tiwari',
      initials: 'AT',
      role: 'EdTech & Training Institute',
      quote: 'Clear reporting, structured social media campaigns, and lead generation funnels that genuinely understand student intent.'
    },
    {
      name: 'Priya Malhotra',
      initials: 'PM',
      role: 'D2C Lifestyle Brand',
      quote: 'From brand identity refresh to Meta ad creatives, their integrated team connected every touchpoint seamlessly.'
    }
  ];

  const rotationDelay = 4200;
  const pad = value => String(value).padStart(2, '0');
  const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>';
  const pauseIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M9 5v14m6-14v14"/></svg>';
  const playIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m8 5 12 7-12 7V5Z"/></svg>';
  let mountedCarousel;
  let cleanupCarousel;
  let rotationPreference;

  function render() {
    const slides = testimonials.map((testimonial, index) => `
      <div class="ds-feedback-slide${index === 0 ? ' is-active' : ''}" data-feedback-slide role="group"
        aria-roledescription="slide" aria-label="${index + 1} of ${testimonials.length}" aria-hidden="${index !== 0}">
        <figure class="ds-feedback-figure">
          <blockquote><p>${testimonial.quote}</p></blockquote>
          <figcaption class="ds-feedback-credit">
            <span class="ds-feedback-monogram" aria-hidden="true">${testimonial.initials}</span>
            <span class="ds-feedback-person"><strong>${testimonial.name}</strong><small>${testimonial.role}</small></span>
          </figcaption>
        </figure>
      </div>`).join('');

    const selectors = testimonials.map((testimonial, index) => `
      <button class="ds-feedback-selector" type="button" data-feedback-go="${index}"
        aria-controls="ds-feedback-slides" aria-label="Show feedback from ${testimonial.name}"
        ${index === 0 ? 'aria-current="true"' : ''}><span aria-hidden="true"></span></button>`).join('');

    return `
      <section class="ds-feedback" data-client-feedback aria-labelledby="ds-feedback-heading" aria-roledescription="carousel">
        <div class="ds-feedback-shell">
          <div class="ds-feedback-heading">
            <span class="ds-feedback-kicker">Client Feedback</span>
            <h2 id="ds-feedback-heading">What Our Partners Say</h2>
            <div class="ds-feedback-controls" role="group" aria-label="Testimonial controls">
              <button class="ds-feedback-control ds-feedback-rotation" type="button" data-feedback-toggle
                aria-label="Pause testimonial rotation" aria-controls="ds-feedback-slides">
                <span data-feedback-icon>${pauseIcon}</span><span data-feedback-action>Pause</span>
              </button>
              <button class="ds-feedback-control ds-feedback-arrow ds-feedback-prev" type="button" data-feedback-prev
                aria-label="Previous testimonial" aria-controls="ds-feedback-slides">${arrow}</button>
              <button class="ds-feedback-control ds-feedback-arrow" type="button" data-feedback-next
                aria-label="Next testimonial" aria-controls="ds-feedback-slides">${arrow}</button>
            </div>
          </div>
          <div class="ds-feedback-stage">
            <div class="ds-feedback-window" data-feedback-window>
              <svg class="ds-feedback-quote-mark" viewBox="0 0 64 48" fill="currentColor" aria-hidden="true" focusable="false">
                <path d="M26 3C10 9 2 20 2 34c0 8 5 12 11 12 7 0 12-5 12-11 0-7-4-11-10-12C17 18 22 13 29 9L26 3Zm34 0C44 9 36 20 36 34c0 8 5 12 11 12 7 0 12-5 12-11 0-7-4-11-10-12C51 18 56 13 63 9L60 3Z"/>
              </svg>
              <div class="ds-feedback-glow" aria-hidden="true"></div>
              <div class="ds-feedback-slides" id="ds-feedback-slides">${slides}</div>
            </div>
            <div class="ds-feedback-progress">
              <div class="ds-feedback-selectors" role="group" aria-label="Choose a testimonial">${selectors}</div>
              <span class="ds-feedback-counter" aria-hidden="true"><strong data-feedback-index>01</strong><span></span>${pad(testimonials.length)}</span>
            </div>
          </div>
        </div>
        <p class="ds-feedback-sr" data-feedback-status role="status"></p>
      </section>`;
  }

  function setup(carousel) {
    const slides = Array.from(carousel.querySelectorAll('[data-feedback-slide]'));
    const selectors = Array.from(carousel.querySelectorAll('[data-feedback-go]'));
    const stage = carousel.querySelector('[data-feedback-window]');
    const toggle = carousel.querySelector('[data-feedback-toggle]');
    const label = carousel.querySelector('[data-feedback-action]');
    const icon = carousel.querySelector('[data-feedback-icon]');
    const counter = carousel.querySelector('[data-feedback-index]');
    const status = carousel.querySelector('[data-feedback-status]');
    const motion = global.matchMedia('(prefers-reduced-motion: reduce)');
    const controller = new AbortController();
    const { signal } = controller;
    const isEnabled = () => rotationPreference ?? !motion.matches;
    let index = 0;
    let timer;
    let visible = !('IntersectionObserver' in global);
    let pointerInside = false;
    let focusInside = false;

    function show(next, announce) {
      const destination = (next + slides.length) % slides.length;
      const previous = index;
      index = destination;
      if (previous !== destination) {
        slides[previous].classList.remove('is-active');
        slides[previous].setAttribute('aria-hidden', 'true');
        selectors[previous].removeAttribute('aria-current');
        slides[destination].classList.add('is-active');
        slides[destination].setAttribute('aria-hidden', 'false');
        selectors[destination].setAttribute('aria-current', 'true');
        counter.textContent = pad(destination + 1);
      }

      if (announce) {
        status.textContent = `Testimonial ${destination + 1} of ${slides.length}. ${testimonials[destination].name}. ${testimonials[destination].quote}`;
      }
    }

    function schedule() {
      global.clearTimeout(timer);
      if (!isEnabled() || !visible || pointerInside || focusInside || document.hidden) return;
      timer = global.setTimeout(() => {
        if (!carousel.isConnected) return;
        show(index + 1);
        schedule();
      }, rotationDelay);
    }

    function syncToggle() {
      const enabled = isEnabled();
      toggle.setAttribute('aria-label', enabled ? 'Pause testimonial rotation' : 'Play testimonial rotation');
      label.textContent = enabled ? 'Pause' : 'Play';
      icon.innerHTML = enabled ? pauseIcon : playIcon;
      schedule();
    }

    toggle.addEventListener('click', () => {
      rotationPreference = !isEnabled();
      if (rotationPreference) focusInside = false;
      syncToggle();
    }, { signal });

    function choose(destination) {
      show(destination, true);
      schedule();
    }

    carousel.querySelector('[data-feedback-prev]').addEventListener('click', () => choose(index - 1), { signal });
    carousel.querySelector('[data-feedback-next]').addEventListener('click', () => choose(index + 1), { signal });
    selectors.forEach((button, destination) => {
      button.addEventListener('click', () => choose(destination), { signal });
    });

    carousel.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      choose(index + (event.key === 'ArrowRight' ? 1 : -1));
    }, { signal });

    carousel.addEventListener('focusin', () => {
      focusInside = true;
      schedule();
    }, { signal });
    carousel.addEventListener('focusout', event => {
      if (carousel.contains(event.relatedTarget)) return;
      focusInside = false;
      schedule();
    }, { signal });
    stage.addEventListener('pointerenter', event => {
      if (event.pointerType === 'touch') return;
      pointerInside = true;
      schedule();
    }, { signal });
    stage.addEventListener('pointerleave', () => {
      pointerInside = false;
      schedule();
    }, { signal });
    document.addEventListener('visibilitychange', schedule, { signal });
    motion.addEventListener('change', syncToggle, { signal });

    const observer = 'IntersectionObserver' in global
      ? new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting && entry.intersectionRatio >= .25;
        schedule();
      }, { threshold: .25 })
      : null;
    observer?.observe(stage);
    syncToggle();

    return () => {
      global.clearTimeout(timer);
      observer?.disconnect();
      controller.abort();
    };
  }

  function mount(root) {
    const carousel = root.querySelector('[data-client-feedback]');
    if (carousel === mountedCarousel) return;
    cleanupCarousel?.();
    mountedCarousel = carousel;
    cleanupCarousel = carousel ? setup(carousel) : undefined;
  }

  global.DS_CLIENT_FEEDBACK = Object.freeze({ render, mount });
})(window);
