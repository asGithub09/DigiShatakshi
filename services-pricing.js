/**
 * Typed source for the Services & Pricing experience.
 * The project is a static site without a CMS or build step, so this file keeps
 * the content local and validates its shape before exposing it to the page.
 *
 * @typedef {'quote'|'packages'} ServicePricingMode
 * @typedef {{total:number,reels:number,carousels:number,staticCreatives:number}} FeedPostMix
 * @typedef {{id:string,name:string,whoFor:string,pricingMode:'fixed',price:number,billingPeriod:null,ctaText:string,feedPosts:FeedPostMix,storiesPerWeek:number,storyExtras:string[],trialReelsAdditional:number,shootAndEditing:string|null}} SocialPackage
 * @typedef {{slug:string,categoryKey:string,name:string,inquiryService:string,description:string,pricingMode:ServicePricingMode,billingPeriod:string|null,artworkVariant:'website'|'social'|'seo'|'paid',ctaText:string,packages:SocialPackage[]}} ServicePricingItem
 */
(function installServicePricingContent(global) {
  /** @type {{schemaVersion:number,services:ServicePricingItem[]}} */
  const content = {
    schemaVersion: 1,
    services: [
      {
        slug: 'website-pricing',
        categoryKey: 'website',
        name: 'Website Pricing',
        inquiryService: 'Website & Landing Pages',
        description: 'A responsive website experience shaped around your offer, audience, and next step.',
        pricingMode: 'quote',
        billingPeriod: null,
        artworkVariant: 'website',
        ctaText: 'Request a quote',
        packages: []
      },
      {
        slug: 'social-media',
        categoryKey: 'smm',
        name: 'Social Media Marketing',
        inquiryService: 'Social Media Marketing',
        description: 'A planned mix of reels, carousels, static creative, and Stories, scoped to the package you select.',
        pricingMode: 'packages',
        billingPeriod: null,
        artworkVariant: 'social',
        ctaText: 'Request a quote',
        packages: [
          {
            id: 'social-essentials',
            name: 'Social Essentials',
            whoFor: 'For teams beginning a consistent publishing rhythm.',
            pricingMode: 'fixed',
            price: 25000,
            billingPeriod: null,
            ctaText: 'Get quote on WhatsApp',
            feedPosts: { total: 8, reels: 4, carousels: 2, staticCreatives: 2 },
            storiesPerWeek: 2,
            storyExtras: [],
            trialReelsAdditional: 0,
            shootAndEditing: 'Professional shoot and editing.'
          },
          {
            id: 'social-growth',
            name: 'Social Growth',
            whoFor: 'For teams planning a fuller mix of social formats.',
            pricingMode: 'fixed',
            price: 35000,
            billingPeriod: null,
            ctaText: 'Get quote on WhatsApp',
            feedPosts: { total: 12, reels: 6, carousels: 3, staticCreatives: 3 },
            storiesPerWeek: 4,
            storyExtras: [],
            trialReelsAdditional: 2,
            shootAndEditing: 'Professional shoot and editing.'
          },
          {
            id: 'social-pro',
            name: 'Social Pro',
            whoFor: 'For teams planning a higher-volume publishing cadence.',
            pricingMode: 'fixed',
            price: 45000,
            billingPeriod: null,
            ctaText: 'Get quote on WhatsApp',
            feedPosts: { total: 16, reels: 8, carousels: 4, staticCreatives: 4 },
            storiesPerWeek: 6,
            storyExtras: ['polls', 'Q&A'],
            trialReelsAdditional: 3,
            shootAndEditing: null
          }
        ]
      },
      {
        slug: 'seo-search-ranking',
        categoryKey: 'seo',
        name: 'SEO & Search Ranking',
        inquiryService: 'Search Engine Optimization (SEO)',
        description: 'Improve how your pages are structured for discovery and give search visitors a clearer path to useful information.',
        pricingMode: 'quote',
        billingPeriod: null,
        artworkVariant: 'seo',
        ctaText: 'Request a quote',
        packages: []
      },
      {
        slug: 'paid-ads-lead-gen',
        categoryKey: 'ads',
        name: 'Paid Ads & Lead Gen',
        inquiryService: 'Paid Advertising (Google / Meta Ads)',
        description: 'Plan paid creative and landing journeys around a clear inquiry path, with campaign scope confirmed to your goals.',
        pricingMode: 'quote',
        billingPeriod: null,
        artworkVariant: 'paid',
        ctaText: 'Request a quote',
        packages: []
      }
    ]
  };

  const allowedArtwork = new Set(['website', 'social', 'seo', 'paid']);
  const allowedServiceModes = new Set(['quote', 'packages']);

  function validateContent(value) {
    if (!value || value.schemaVersion !== 1 || !Array.isArray(value.services) || value.services.length !== 4) return false;
    const slugs = new Set();
    const categoryKeys = new Set();

    for (const service of value.services) {
      if (!service || typeof service !== 'object') return false;
      if (![service.slug, service.categoryKey, service.name, service.inquiryService, service.description, service.ctaText].every(item => typeof item === 'string' && item.trim())) return false;
      if (slugs.has(service.slug) || categoryKeys.has(service.categoryKey)) return false;
      slugs.add(service.slug);
      categoryKeys.add(service.categoryKey);
      if (!allowedServiceModes.has(service.pricingMode) || !allowedArtwork.has(service.artworkVariant)) return false;
      if (service.billingPeriod !== null && typeof service.billingPeriod !== 'string') return false;
      if (!Array.isArray(service.packages)) return false;
      if (service.pricingMode === 'quote' && service.packages.length !== 0) return false;
      if (service.pricingMode === 'packages' && service.packages.length === 0) return false;

      const packageIds = new Set();
      for (const plan of service.packages) {
        if (!plan || ![plan.id, plan.name, plan.whoFor, plan.ctaText].every(item => typeof item === 'string' && item.trim())) return false;
        if (packageIds.has(plan.id)) return false;
        packageIds.add(plan.id);
        if (plan.pricingMode !== 'fixed' || !Number.isSafeInteger(plan.price) || plan.price <= 0 || plan.billingPeriod !== null) return false;
        if (!plan.feedPosts || !['total', 'reels', 'carousels', 'staticCreatives'].every(key => Number.isInteger(plan.feedPosts[key]) && plan.feedPosts[key] >= 0)) return false;
        if (plan.feedPosts.total !== plan.feedPosts.reels + plan.feedPosts.carousels + plan.feedPosts.staticCreatives) return false;
        if (!Number.isInteger(plan.storiesPerWeek) || plan.storiesPerWeek < 0 || !Array.isArray(plan.storyExtras) || !plan.storyExtras.every(item => typeof item === 'string' && item.trim())) return false;
        if (!Number.isInteger(plan.trialReelsAdditional) || plan.trialReelsAdditional < 0) return false;
        if (plan.shootAndEditing !== null && typeof plan.shootAndEditing !== 'string') return false;
      }
    }

    const social = value.services.find(service => service.slug === 'social-media');
    if (!social || social.packages.map(plan => plan.name).join('|') !== 'Social Essentials|Social Growth|Social Pro') return false;
    return true;
  }

  function deepFreeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.freeze(value);
      Object.values(value).forEach(deepFreeze);
    }
    return value;
  }

  if (validateContent(content)) {
    global.DS_SERVICE_PRICING_CONTENT = deepFreeze(content);
  } else {
    global.DS_SERVICE_PRICING_CONTENT = null;
    console.error('Services & Pricing content failed validation.');
  }
})(window);
