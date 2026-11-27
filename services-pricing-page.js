(function installServicesPricingPage(global) {
  const catalog = global.DS_SERVICE_PRICING_CONTENT;
  const services = catalog && Array.isArray(catalog.services) ? catalog.services : [];
  const inrFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  });

  function formatPackagePrice(price) {
    return inrFormatter.format(price);
  }

  function packageWhatsAppUrl(planName) {
    const message = 'Hi, I am interested in the ' + planName +
      ' package and want to discuss and understand how it will grow my business.';
    return 'https://wa.me/917310251337?text=' + encodeURIComponent(message);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  const deliverableIcons = {
    posts: '<rect x="4" y="4" width="12" height="15" rx="2"/><path d="M8 8h4M8 11h4M8 14h2"/><path d="M8 2h9a3 3 0 0 1 3 3v11"/>',
    reel: '<rect x="4" y="3" width="16" height="18" rx="4"/><path d="m10 8 5 4-5 4V8Z"/>',
    carousel: '<rect x="7" y="5" width="13" height="15" rx="2"/><path d="M4 17V5a2 2 0 0 1 2-2h10"/>',
    static: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m4 17 5-4 3 2 3-4 5 5"/>',
    stories: '<path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6.5A7.5 7.5 0 1 1 20 11.5Z"/><path d="M8 11h.01M12 11h.01M16 11h.01" stroke-width="2.5" stroke-linecap="round"/>',
    shoot: '<path d="M4 7h3l1.5-2h7L17 7h3v12H4V7Z"/><circle cx="12" cy="13" r="3.5"/>',
    trial: '<path d="M4 5h16v14H4zM4 9h16M8 5l-2 4M14 5l-2 4"/><path d="m10 12 5 2.5-5 2.5V12Z"/>'
  };

  function deliverableIcon(name) {
    return '<span class="ds-deliverable-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" focusable="false">' +
      (deliverableIcons[name] || deliverableIcons.posts) + '</svg></span>';
  }

  function getService(slug) {
    return services.find(service => service.slug === slug) || null;
  }

  function getServiceFromUrl() {
    const requested = new URLSearchParams(global.location.search).get('service');
    return getService(requested) || services[0] || null;
  }

  function renderArtwork(service) {
    const caption = '<span class="ds-art-caption">' + escapeHtml(service.name) + ' / ILLUSTRATIVE STUDY</span>';
    if (service.artworkVariant === 'website') {
      return '<div class="ds-art-scene ds-art-website">' + caption +
        '<div class="ds-browser-window">' +
          '<div class="ds-browser-bar"><i></i><i></i><i></i><span class="ds-browser-url">studio.example / work</span></div>' +
          '<div class="ds-site-nav"><strong class="ds-site-wordmark">FORM / FIELD</strong><span class="ds-site-links">Work Studio Contact</span></div>' +
          '<div class="ds-site-hero"><span class="ds-site-eyebrow">Independent creative studio</span>' +
            '<h3>Make room for<br><em>what’s next.</em></h3><p>Digital ideas, built with intention.</p>' +
            '<span class="ds-site-link">Explore the work <b aria-hidden="true">↗</b></span></div>' +
          '<div class="ds-site-below"><div><span></span><span></span><span></span></div><div><span></span><span></span><span></span></div></div>' +
        '</div>' +
        '<div class="ds-mobile-frame"><div class="ds-mobile-notch"></div><div class="ds-mobile-logo">FORM / FIELD</div>' +
          '<div class="ds-mobile-visual"><b>Make room<br>for what’s next.</b><i></i></div></div>' +
        '<span class="ds-art-note">Responsive layout study</span></div>';
    }
    if (service.artworkVariant === 'social') {
      return '<div class="ds-art-scene ds-art-social">' + caption +
        '<div class="ds-social-reel"><div class="ds-social-reel-screen"><span>Reel / 9:16</span><strong>Small moments.<br>Good light.</strong></div></div>' +
        '<div class="ds-social-carousel">' +
          '<div class="ds-carousel-frame"><small>Carousel · 01</small><strong>Make everyday<br>feel considered.</strong><i></i></div>' +
          '<div class="ds-carousel-frame"></div>' +
          '<div class="ds-carousel-frame"><small>Creative study</small><strong>Details matter.</strong><i></i></div>' +
        '</div>' +
        '<div class="ds-social-static"><span>Static creative</span><strong>Find your<br>own rhythm.</strong><i></i></div>' +
        '<span class="ds-art-note">Editorial content mix · illustrative</span></div>';
    }
    if (service.artworkVariant === 'seo') {
      return '<div class="ds-art-scene ds-art-seo">' + caption +
        '<div class="ds-search-bar"><span class="ds-search-lens" aria-hidden="true"></span><span>local creative studio</span></div>' +
        '<div class="ds-search-result"><small>digishatakshi.com / services</small><strong>SEO &amp; search visibility</strong>' +
          '<p>A sample search result layout, shown to illustrate page hierarchy and a clear path to relevant information.</p></div>' +
        '<div class="ds-visibility-chart"><strong>Search visibility</strong><small>Illustrative visibility index · sample data</small>' +
          '<svg viewBox="0 0 260 100" role="presentation" aria-hidden="true">' +
            '<path d="M8 82H252M8 54H252M8 26H252" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="1"/>' +
            '<path d="M10 76C38 74 42 68 67 68S100 58 122 61s34-12 55-11 42-12 73-28" fill="none" stroke="#92d7bd" stroke-width="3" stroke-linecap="round"/>' +
            '<circle cx="10" cy="76" r="3" fill="#f5f3ec"/><circle cx="250" cy="22" r="4" fill="#92d7bd"/>' +
            '<text x="8" y="98" fill="#b7c9c9" font-size="8">W1</text><text x="86" y="98" fill="#b7c9c9" font-size="8">W2</text>' +
            '<text x="164" y="98" fill="#b7c9c9" font-size="8">W3</text><text x="236" y="98" fill="#b7c9c9" font-size="8">W4</text>' +
          '</svg></div><span class="ds-art-note">Illustrative only · not client results</span></div>';
    }
    return '<div class="ds-art-scene ds-art-paid">' + caption +
      '<div class="ds-paid-sequence">' +
        '<div class="ds-paid-card"><small>Paid creative</small><strong>A clearer next step.</strong><p>Sample ad composition with a focused message.</p><span class="ds-paid-action">Learn more</span></div>' +
        '<span class="ds-paid-connector" aria-hidden="true">→</span>' +
        '<div class="ds-paid-card"><small>Landing page</small><strong>One idea.<br>One path.</strong><div class="ds-paid-lines"><i></i><i></i><i></i></div><span class="ds-paid-action">View details</span></div>' +
        '<span class="ds-paid-connector" aria-hidden="true">→</span>' +
        '<div class="ds-paid-card"><small>Inquiry</small><strong>Start a conversation.</strong><p>Request form preview</p><span class="ds-paid-action">Send enquiry</span></div>' +
      '</div><span class="ds-art-note">Ad → page → inquiry · illustrative journey</span></div>';
  }

  function renderPackage(plan) {
    const feed = plan.feedPosts;
    const mix = feed.reels + ' reels, ' + feed.carousels + ' carousels, ' + feed.staticCreatives + ' static creatives';
    const storySummary = plan.storiesPerWeek + ' Stories per week' +
      (plan.storyExtras.length ? ', including ' + plan.storyExtras.join(' and ') : '');
    const fullDetails = [
      feed.total + ' feed posts: ' + mix + '.',
      plan.shootAndEditing,
      storySummary + '.',
      plan.trialReelsAdditional > 0
        ? plan.trialReelsAdditional + ' additional Trial Reels, separate from the ' + feed.total + ' feed posts.'
        : 'No additional Trial Reels.'
    ].filter(Boolean);
    const formatRows = [
      ['reel', 'Reels', feed.reels],
      ['carousel', 'Carousels', feed.carousels],
      ['static', 'Static creatives', feed.staticCreatives]
    ].map(([icon, label, count]) => '<div class="ds-package-format-row">' + deliverableIcon(icon) +
      '<span>' + escapeHtml(label) + '</span><strong>' + count + '</strong></div>').join('');
    const shootRow = plan.shootAndEditing
      ? '<div class="ds-package-inclusion-row">' + deliverableIcon('shoot') + '<span><strong>Professional shoot and editing</strong></span></div>'
      : '';
    const trialRow = plan.trialReelsAdditional > 0
      ? '<div class="ds-package-inclusion-row is-trial">' + deliverableIcon('trial') + '<span><strong>' + plan.trialReelsAdditional + ' additional Trial Reels</strong><small>Separate from the ' + feed.total + ' feed-post total</small></span></div>'
      : '<div class="ds-package-inclusion-row is-muted">' + deliverableIcon('trial') + '<span><strong>No additional Trial Reels</strong></span></div>';
    const recommendedClass = plan.recommended === true ? ' is-recommended' : '';

    return '<article class="ds-package-card' + recommendedClass + '">' +
      '<h3>' + escapeHtml(plan.name) + '</h3>' +
      '<p class="ds-package-audience">' + escapeHtml(plan.whoFor) + '</p>' +
      '<p class="ds-package-price">' + escapeHtml(formatPackagePrice(plan.price)) + '</p>' +
      '<a class="ds-package-cta" href="' + escapeHtml(packageWhatsAppUrl(plan.name)) + '" target="_blank" rel="noopener noreferrer"' +
        ' aria-label="' + escapeHtml(plan.ctaText + ' for ' + plan.name) + '">' +
        '<span>' + escapeHtml(plan.ctaText) + '</span><span aria-hidden="true">↗</span></a>' +
      '<h4 class="ds-package-section-title">Key deliverables</h4>' +
      '<div class="ds-package-highlights">' +
        '<div class="ds-package-feed-total">' + deliverableIcon('posts') + '<span><strong>' + feed.total + '</strong><small>feed posts</small></span></div>' +
        '<div class="ds-package-format-list" aria-label="Feed post formats">' + formatRows + '</div>' +
        '<div class="ds-package-inclusion-row">' + deliverableIcon('stories') + '<span><strong>' + escapeHtml(storySummary) + '</strong></span></div>' +
        shootRow + trialRow +
      '</div>' +
      '<div class="ds-package-full"><h4 class="ds-package-section-title">Full details</h4>' +
        '<ul class="ds-package-full-list">' + fullDetails.map(item => '<li>' + escapeHtml(item) + '</li>').join('') + '</ul></div>' +
    '</article>';
  }

  function renderOffers(service) {
    if (!service) return '';
    if (service.pricingMode === 'packages') {
      return '<section class="ds-pricing-offer" aria-labelledby="ds-pricing-offer-title">' +
        '<div class="ds-offer-heading"><div><p class="ds-pricing-section-label">Package comparison</p>' +
          '<h2 id="ds-pricing-offer-title">Social media packages</h2><p>' + escapeHtml(service.description) + '</p></div></div>' +
        '<div class="ds-package-grid">' + service.packages.map(renderPackage).join('') + '</div></section>';
    }
    return '<section class="ds-pricing-offer" aria-labelledby="ds-pricing-offer-title">' +
      '<div class="ds-offer-heading"><div><p class="ds-pricing-section-label">Selected service</p>' +
        '<h2 id="ds-pricing-offer-title">' + escapeHtml(service.name) + '</h2><p>' + escapeHtml(service.description) + '</p></div>' +
        '<button class="ds-offer-quote" type="button" data-pricing-quote data-inquiry-service="' + escapeHtml(service.inquiryService) + '" data-inquiry-plan="">' +
          '<span>' + escapeHtml(service.ctaText) + '</span><span aria-hidden="true">↗</span></button></div></section>';
  }

  function render() {
    if (!services.length) {
      return '<section id="ds-pricing-page"><div class="ds-pricing-container"><h1>Services &amp; Pricing</h1><p>Pricing information is temporarily unavailable. Please contact Digi Shatakshi for a quote.</p></div></section>';
    }
    const selected = getServiceFromUrl();
    return '<section id="ds-pricing-page"><div class="ds-pricing-container">' +
      '<header class="ds-pricing-hero"><div><p class="ds-pricing-kicker">Digi Shatakshi / Services &amp; Pricing</p>' +
        '<h1>Good digital work.<br><em>Clearly scoped.</em></h1></div>' +
        '<p class="ds-pricing-intro">Explore four areas of digital work. Compare social content inclusions, then request a quote when your project needs a custom scope.</p></header>' +
      '<div class="ds-pricing-workbench">' +
        '<div class="ds-pricing-selector"><div class="ds-pricing-selector-heading"><p class="ds-pricing-section-label">Choose a service</p>' +
          '<span data-pricing-service-count>01 — ' + String(services.length).padStart(2, '0') + '</span></div>' +
          '<div class="ds-pricing-options" role="group" aria-label="Select a service"><span class="ds-pricing-marker" aria-hidden="true"></span>' +
            services.map((service, index) => '<button class="ds-pricing-option" type="button" data-pricing-service="' + escapeHtml(service.slug) +
              '" aria-pressed="' + (service.slug === selected.slug ? 'true' : 'false') + '">' +
              '<span class="ds-pricing-option-number">' + String(index + 1).padStart(2, '0') + '</span>' +
              '<span class="ds-pricing-option-title">' + escapeHtml(service.name) + '</span>' +
              '<span class="ds-pricing-option-arrow" aria-hidden="true">↗</span></button>').join('') +
          '</div></div>' +
        '<div class="ds-pricing-main"><div class="ds-pricing-artwork" id="ds-pricing-artwork" aria-hidden="true">' + renderArtwork(selected) + '</div></div>' +
      '</div><div id="ds-pricing-offer" aria-live="polite">' + renderOffers(selected) + '</div>' +
      '<p class="ds-pricing-status" id="ds-pricing-status" aria-live="polite"></p></div></section>';
  }

  function updateMarker() {
    const options = document.querySelector('#ds-pricing-page .ds-pricing-options');
    const marker = options && options.querySelector('.ds-pricing-marker');
    const active = options && options.querySelector('[data-pricing-service][aria-pressed="true"]');
    if (!options || !marker || !active) return;
    marker.style.height = active.offsetHeight + 'px';
    marker.style.transform = 'translateY(' + active.offsetTop + 'px)';
  }

  function pushServiceUrl(slug) {
    if (global.location.protocol === 'file:') return;
    const url = new URL(global.location.href);
    url.pathname = '/pricing';
    url.searchParams.set('service', slug);
    const next = url.pathname + url.search + url.hash;
    const current = global.location.pathname + global.location.search + global.location.hash;
    if (current !== next) global.history.pushState({ view: 'pricing', service: slug }, '', next);
  }

  function select(slug, updateUrl) {
    const service = getService(slug);
    const options = document.querySelector('#ds-pricing-page .ds-pricing-options');
    const artwork = document.getElementById('ds-pricing-artwork');
    const offer = document.getElementById('ds-pricing-offer');
    if (!service || !options || !artwork || !offer) return;

    const previousSlug = options.querySelector('[data-pricing-service][aria-pressed="true"]')?.dataset.pricingService;
    options.querySelectorAll('[data-pricing-service]').forEach(button => {
      button.setAttribute('aria-pressed', button.dataset.pricingService === service.slug ? 'true' : 'false');
    });
    offer.innerHTML = renderOffers(service);
    if (previousSlug !== service.slug) {
      const reduceMotion = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
      global.clearTimeout(artwork._pricingSwitchTimer);
      artwork._pricingSwitchTimer = null;
      artwork.classList.remove('is-switching');
      if (reduceMotion) {
        artwork.innerHTML = renderArtwork(service);
      } else {
        artwork.classList.add('is-switching');
        artwork._pricingSwitchTimer = global.setTimeout(() => {
          artwork.innerHTML = renderArtwork(service);
          global.requestAnimationFrame(() => artwork.classList.remove('is-switching'));
        }, 90);
      }
    }
    const status = document.getElementById('ds-pricing-status');
    if (status) status.textContent = service.name + ' selected.';
    if (updateUrl !== false) pushServiceUrl(service.slug);
    global.requestAnimationFrame(updateMarker);
  }

  function navigateToService(slug) {
    const service = getService(slug);
    if (!service || typeof global.navigateTo !== 'function') return;
    if (global.location.protocol !== 'file:') {
      global.history.pushState({ view: 'pricing', service: service.slug }, '', '/pricing?service=' + encodeURIComponent(service.slug));
    }
    global.navigateTo('pricing', false);
  }

  function init() {
    const page = document.getElementById('ds-pricing-page');
    const options = page && page.querySelector('.ds-pricing-options');
    const offer = page && page.querySelector('#ds-pricing-offer');
    const artwork = page && page.querySelector('#ds-pricing-artwork');
    if (!page || !options || !offer || !artwork) return;

    const buttons = Array.from(options.querySelectorAll('[data-pricing-service]'));
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => select(button.dataset.pricingService));
      button.addEventListener('keydown', event => {
        let nextIndex = index;
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') nextIndex = (index + 1) % buttons.length;
        else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') nextIndex = (index - 1 + buttons.length) % buttons.length;
        else if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = buttons.length - 1;
        else return;
        event.preventDefault();
        buttons[nextIndex].focus();
        select(buttons[nextIndex].dataset.pricingService);
      });
    });

    offer.addEventListener('click', event => {
      const quote = event.target.closest('[data-pricing-quote]');
      if (quote) global.dsOpenQuoteModal && global.dsOpenQuoteModal(quote.dataset.inquiryService, quote.dataset.inquiryPlan || '');
    });

    if (global.matchMedia && global.matchMedia('(hover: hover) and (pointer: fine)').matches &&
        !(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      artwork.addEventListener('pointermove', event => {
        const scene = artwork.querySelector('.ds-art-scene');
        if (!scene) return;
        const bounds = artwork.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - .5;
        const y = (event.clientY - bounds.top) / bounds.height - .5;
        scene.style.setProperty('--dsp-tilt-x', (x * 2.2).toFixed(2) + 'deg');
        scene.style.setProperty('--dsp-tilt-y', (-y * 1.8).toFixed(2) + 'deg');
      });
      artwork.addEventListener('pointerleave', () => {
        const scene = artwork.querySelector('.ds-art-scene');
        if (!scene) return;
        scene.style.setProperty('--dsp-tilt-x', '0deg');
        scene.style.setProperty('--dsp-tilt-y', '0deg');
      });
    }

    updateMarker();
    if (!global.__dsPricingResizeBound) {
      global.__dsPricingResizeBound = true;
      global.addEventListener('resize', () => global.requestAnimationFrame(updateMarker));
    }
  }

  global.DS_SERVICE_PRICING_PAGE = Object.freeze({ render, init, select, navigateToService, getService, formatPackagePrice, getServiceByCategory: function(key) {
    return services.find(service => service.categoryKey === key) || null;
  } });
})(window);
