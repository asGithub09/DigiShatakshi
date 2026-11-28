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

  function getService(slug) {
    return services.find(service => service.slug === slug) || null;
  }

  function getServiceFromUrl() {
    const requested = new URLSearchParams(global.location.search).get('service');
    return getService(requested) || services[0] || null;
  }

  function renderArtwork(service) {
    const caption = '<span class="ds-art-caption">Illustrative study</span>';
    if (service.artworkVariant === 'website') {
      return '<div class="ds-art-scene ds-art-website">' + caption +
        '<div class="ds-browser-window">' +
          '<div class="ds-browser-bar"><i></i><i></i><i></i><span class="ds-browser-url">studio.example / work</span></div>' +
          '<div class="ds-site-nav"><strong class="ds-site-wordmark">FORM / FIELD</strong><span class="ds-site-links">Work Studio Contact</span></div>' +
          '<div class="ds-site-hero"><span class="ds-site-eyebrow">Independent creative studio</span>' +
            '<strong>Design for<br><em>everyday life.</em></strong>' +
            '<span class="ds-site-link">Explore the work <b aria-hidden="true">↗</b></span></div>' +
          '<div class="ds-site-below"><div><span></span><span></span><span></span></div><div><span></span><span></span><span></span></div></div>' +
        '</div>' +
        '<div class="ds-mobile-frame"><div class="ds-mobile-notch"></div><div class="ds-mobile-logo">FORM / FIELD</div>' +
          '<div class="ds-mobile-visual"><b>Design for<br>everyday life.</b><i></i></div></div>' +
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
        '<span class="ds-art-note">Social content study</span></div>';
    }
    if (service.artworkVariant === 'seo') {
      return '<div class="ds-art-scene ds-art-seo">' + caption +
        '<div class="ds-search-bar"><span class="ds-search-lens" aria-hidden="true"></span><span>local creative studio</span></div>' +
        '<div class="ds-search-result"><small>digishatakshi.com / services</small><strong>SEO &amp; search visibility</strong>' +
          '<p>A sample search result layout, shown to illustrate page hierarchy and a clear path to relevant information.</p></div>' +
        '<div class="ds-visibility-chart"><strong>Search visibility</strong><small>Illustrative visibility index · sample data</small>' +
          '<svg viewBox="0 0 260 100" role="presentation" aria-hidden="true">' +
            '<path d="M8 82H252M8 54H252M8 26H252" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="1"/>' +
            '<path d="M10 76C38 74 42 68 67 68S100 58 122 61s34-12 55-11 42-12 73-28" fill="none" stroke="#b9d2b9" stroke-width="2" stroke-linecap="round"/>' +
            '<circle cx="10" cy="76" r="3" fill="#f5f3ec"/><circle cx="250" cy="22" r="4" fill="#b9d2b9"/>' +
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
      '</div><span class="ds-art-note">Ad to enquiry flow</span></div>';
  }

  function renderPackage(plan) {
    const feed = plan.feedPosts;
    const rows = [
      ['Feed posts', feed.total],
      ['Reels', feed.reels],
      ['Carousels', feed.carousels],
      ['Static creatives', feed.staticCreatives],
      ['Stories per week', plan.storiesPerWeek, plan.storyExtras.length ? 'Includes ' + plan.storyExtras.join(' and ') : ''],
      ['Shoot and edit', plan.shootAndEditing ? 'Included' : 'Not listed', plan.shootAndEditing || ''],
      ['Additional trial reels', plan.trialReelsAdditional || 'None']
    ];
    const titleId = 'ds-package-' + escapeHtml(plan.id);

    return '<article class="ds-package-card" aria-labelledby="' + titleId + '">' +
      '<h3 id="' + titleId + '">' + escapeHtml(plan.name) + '</h3>' +
      '<p class="ds-package-audience">' + escapeHtml(plan.whoFor) + '</p>' +
      '<p class="ds-package-price">' + escapeHtml(formatPackagePrice(plan.price)) + '</p>' +
      '<a class="ds-package-cta" href="' + escapeHtml(packageWhatsAppUrl(plan.name)) + '" target="_blank" rel="noopener noreferrer"' +
        ' aria-label="' + escapeHtml(plan.ctaText + ' for ' + plan.name) + '">' +
        '<span>' + escapeHtml(plan.ctaText) + '</span><span aria-hidden="true">↗</span></a>' +
      '<dl class="ds-package-inclusions">' + rows.map(([label, value, detail]) =>
        '<div class="ds-package-row"><dt>' + escapeHtml(label) + '</dt><dd>' + escapeHtml(value) + '</dd>' +
        (detail ? '<dd class="ds-package-row-note">' + escapeHtml(detail) + '</dd>' : '') + '</div>'
      ).join('') + '</dl>' +
    '</article>';
  }

  function renderOffers(service) {
    if (!service) return '';
    if (service.pricingMode === 'packages') {
      return '<section class="ds-pricing-offer" aria-labelledby="ds-pricing-offer-title">' +
        '<div class="ds-offer-heading"><div><h2 id="ds-pricing-offer-title">Social media packages</h2>' +
          '<p>' + escapeHtml(service.description) + '</p></div></div>' +
        '<div class="ds-package-grid">' + service.packages.map(renderPackage).join('') + '</div>' +
        '<p class="ds-package-note">Trial reels are separate from the feed post count.</p></section>';
    }
    return '<section class="ds-pricing-offer ds-pricing-quote-offer" aria-labelledby="ds-pricing-offer-title">' +
      '<div class="ds-offer-heading"><div><h2 id="ds-pricing-offer-title">' + escapeHtml(service.name) + '</h2>' +
        '<p>' + escapeHtml(service.description) + '</p></div>' +
        '<button class="ds-offer-quote" type="button" data-pricing-quote data-inquiry-service="' + escapeHtml(service.inquiryService) + '" data-inquiry-plan="">' +
          '<span>' + escapeHtml(service.ctaText) + '</span><span aria-hidden="true">↗</span></button></div></section>';
  }

  function render() {
    if (!services.length) {
      return '<section id="ds-pricing-page"><div class="ds-pricing-container"><h1>Services &amp; Pricing</h1><p>Pricing information is temporarily unavailable. Please contact Digi Shatakshi for a quote.</p></div></section>';
    }
    const selected = getServiceFromUrl();
    return '<section id="ds-pricing-page"><div class="ds-pricing-container">' +
      '<header class="ds-pricing-hero"><h1>Services &amp; pricing</h1>' +
        '<p class="ds-pricing-intro">Compare social media packages or request a quote for your website, search or advertising project.</p></header>' +
      '<div class="ds-pricing-workbench">' +
        '<div class="ds-pricing-selector"><h2 class="ds-pricing-section-label" id="ds-pricing-select-title">Choose a service</h2>' +
          '<div class="ds-pricing-options" role="group" aria-labelledby="ds-pricing-select-title">' +
            services.map((service, index) => '<button class="ds-pricing-option" type="button" data-pricing-service="' + escapeHtml(service.slug) +
              '" aria-controls="ds-pricing-offer" aria-pressed="' + (service.slug === selected.slug ? 'true' : 'false') + '">' +
              '<span class="ds-pricing-option-number" aria-hidden="true">' + String(index + 1).padStart(2, '0') + '</span>' +
              '<span class="ds-pricing-option-title">' + escapeHtml(service.name) + '</span>' +
              '<span class="ds-pricing-option-arrow" aria-hidden="true">→</span></button>').join('') +
          '</div></div>' +
        '<div id="ds-pricing-offer">' + renderOffers(selected) + '</div>' +
        '<div class="ds-pricing-artwork" id="ds-pricing-artwork" aria-hidden="true">' + renderArtwork(selected) + '</div>' +
      '</div>' +
      '<p class="ds-pricing-status" id="ds-pricing-status" aria-live="polite"></p></div></section>';
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
    if (previousSlug !== service.slug) {
      options.querySelectorAll('[data-pricing-service]').forEach(button => {
        button.setAttribute('aria-pressed', button.dataset.pricingService === service.slug ? 'true' : 'false');
      });
      offer.innerHTML = renderOffers(service);
      artwork.innerHTML = renderArtwork(service);
      artwork.firstElementChild?.classList.add('is-entering');
      offer.firstElementChild?.classList.add('is-entering');
      const status = document.getElementById('ds-pricing-status');
      if (status) status.textContent = service.name + ' selected. Pricing information follows the service options.';
    }
    if (updateUrl !== false) pushServiceUrl(service.slug);
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

  }

  global.DS_SERVICE_PRICING_PAGE = Object.freeze({ render, init, select, navigateToService, getService, formatPackagePrice, getServiceByCategory: function(key) {
    return services.find(service => service.categoryKey === key) || null;
  } });
})(window);
