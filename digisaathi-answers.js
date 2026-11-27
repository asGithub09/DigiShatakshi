(function installDigiSaathiAnswers(global) {
  'use strict';

  const serviceTopics = {
    website: {
      aliases: ['website', 'web site', 'webiste', 'web design', 'web development', 'landing page', 'online store', 'ecommerce', 'e commerce', 'shopify', 'site banwana', 'site banwani', 'वेबसाइट', 'वेब साइट', 'लैंडिंग पेज', 'ऑनलाइन स्टोर', 'साइट बनवानी', 'साइट बनवाना', 'ई कॉमर्स'],
      catalogKey: 'website', route: '/service-web',
      label: ['Website', 'वेबसाइट', 'Website'],
      description: [
        'We build business websites and campaign landing pages. For a business site, people should be able to understand what you offer and contact you easily.',
        'हम बिज़नेस वेबसाइट और कैंपेन के लिए लैंडिंग पेज बनाते हैं। बिज़नेस साइट पर लोगों को आपकी सेवाएँ समझने और संपर्क करने में आसानी होनी चाहिए।',
        'Hum business websites aur campaign ke liye landing pages banate hain. Business site par log aapki services samajh sakein aur aasani se contact kar sakein.'
      ],
      followUp: [
        'Do you need a new business website, a page for an ad campaign, or a store that sells online?',
        'आपको नई बिज़नेस वेबसाइट चाहिए, विज्ञापन के लिए एक पेज, या ऑनलाइन बिक्री के लिए स्टोर?',
        'Aapko nayi business website chahiye, ads ke liye landing page, ya online bechne ke liye store?'
      ]
    },
    social: {
      aliases: ['social', 'social media', 'smm', 'instagram', 'insta', 'facebook', 'reels', 'reel', 'posts', 'social media marketing', 'सोशल', 'सोशल मीडिया', 'इंस्टाग्राम', 'फेसबुक', 'रील', 'रील्स', 'पोस्ट'],
      catalogKey: 'smm', route: '/service-smm',
      label: ['Social media', 'सोशल मीडिया', 'Social media'],
      description: [
        'Our social media packages give you a regular mix of reels, carousels, static posts and Stories.',
        'हमारे सोशल मीडिया पैकेज में रील्स, कैरोसेल, फ़ोटो या ग्राफ़िक पोस्ट और स्टोरीज़ का नियमित मिश्रण मिलता है।',
        'Hamare social media packages mein reels, carousels, static posts aur Stories ka regular mix milta hai.'
      ],
      followUp: [
        'Which platform do you use, and what would you most like to improve?',
        'आप कौन सा प्लेटफ़ॉर्म इस्तेमाल करते हैं और वहाँ क्या सुधारना चाहते हैं?',
        'Aap kaunsa platform use karte hain, aur wahan kya improve karna chahte hain?'
      ]
    },
    seo: {
      aliases: ['seo', 'search engine', 'search ranking', 'rank on google', 'google ranking', 'google maps', 'google business profile', 'एसईओ', 'एस ई ओ', 'गूगल मैप्स', 'गूगल पर रैंक', 'गूगल पर दिख', 'सर्च रैंकिंग'],
      catalogKey: 'seo', route: '/service-seo',
      label: ['SEO', 'एसईओ', 'SEO'],
      description: [
        'SEO helps people find your business through search. We can review your website, target keywords and local search presence.',
        'एसईओ से लोगों के लिए सर्च में आपका बिज़नेस ढूँढना आसान हो सकता है। हम आपकी वेबसाइट, कीवर्ड और लोकल सर्च की स्थिति देख सकते हैं।',
        'SEO se search mein aapka business milna aasaan ho sakta hai. Hum website, keywords aur local search presence review kar sakte hain.'
      ],
      followUp: [
        'Do you already have a website, or is your priority being found locally on Google?',
        'क्या आपकी वेबसाइट पहले से है, या आपकी प्राथमिकता अपने शहर में Google पर दिखना है?',
        'Kya aapki website pehle se hai, ya aap apne shehar mein Google par dikhna chahte hain?'
      ]
    },
    ads: {
      aliases: ['ads', 'ad campaign', 'advertising', 'google ads', 'meta ads', 'facebook ads', 'instagram ads', 'paid promotion', 'paid campaign', 'boost', 'ad chalana', 'ads chalane', 'ad chalwana', 'विज्ञापन', 'पेड ऐड', 'पेड एड', 'गूगल ऐड्स', 'गूगल एड्स', 'मेटा ऐड्स', 'मेटा एड्स', 'ऐड चलाना', 'बूस्ट'],
      catalogKey: 'ads', route: '/service-ads',
      label: ['Paid ads', 'पेड विज्ञापन', 'Paid ads'],
      description: [
        'We plan Google and Meta campaigns around your audience, offer and goal. We can also help connect your ads to a focused landing page.',
        'हम आपके ग्राहकों, ऑफ़र और लक्ष्य के अनुसार Google और Meta कैंपेन की योजना बनाते हैं। ज़रूरत हो तो विज्ञापन के लिए अलग लैंडिंग पेज भी बना सकते हैं।',
        'Hum aapke audience, offer aur goal ke hisaab se Google aur Meta campaigns plan karte hain. Zaroorat ho to ads ko landing page se bhi connect kar sakte hain.'
      ],
      followUp: [
        'What are you promoting, and would you like more enquiries, sales or reach?',
        'आप किस चीज़ का प्रचार करना चाहते हैं और आपका लक्ष्य ज़्यादा पूछताछ, बिक्री या लोगों तक पहुँचना है?',
        'Aap kya promote karna chahte hain? Main goal enquiries, sales ya reach hai?'
      ]
    },
    branding: {
      aliases: ['branding', 'brand identity', 'visual identity', 'logo', 'creative design', 'brand design', 'ब्रांडिंग', 'लोगो', 'ब्रांड पहचान', 'क्रिएटिव डिजाइन'],
      route: '/service-branding', inquiry: 'Branding & Creative',
      label: ['Branding', 'ब्रांडिंग', 'Branding'],
      description: [
        'We help define your visual identity and create designs for campaigns and social media.',
        'हम आपके ब्रांड की दृश्य पहचान बनाने और कैंपेन व सोशल मीडिया के लिए डिज़ाइन तैयार करने में मदद करते हैं।',
        'Hum aapke brand ki visual identity aur campaigns ya social media ke designs par kaam karte hain.'
      ],
      followUp: [
        'Are you launching a new brand or refreshing an existing identity?',
        'क्या आप नया ब्रांड शुरू कर रहे हैं या मौजूदा पहचान को नया रूप देना चाहते हैं?',
        'Naya brand launch kar rahe hain ya existing look ko refresh karna hai?'
      ]
    },
    content: {
      aliases: ['content marketing', 'content writing', 'copywriting', 'website content', 'blog writing', 'blog content', 'content strategy', 'कंटेंट मार्केटिंग', 'कंटेंट राइटिंग', 'ब्लॉग', 'वेबसाइट का कंटेंट'],
      route: '/service-content', inquiry: 'Content Marketing',
      label: ['Content', 'कंटेंट', 'Content'],
      description: [
        'We can plan content around what your customers need to know, from website copy to articles and campaigns.',
        'हम ग्राहकों के सवालों को ध्यान में रखकर वेबसाइट के लेख, ब्लॉग और कैंपेन का कंटेंट तैयार करने में मदद करते हैं।',
        'Hum customers ke sawaalon ko dhyan mein rakh kar website copy, articles aur campaign content plan karte hain.'
      ],
      followUp: [
        'Which kind of content do you need first?',
        'आपको पहले किस तरह का कंटेंट चाहिए?',
        'Aapko pehle kis type ka content chahiye?'
      ]
    },
    leads: {
      aliases: ['lead generation', 'business leads', 'lead gen', 'more leads', 'more enquiries', 'more inquiries', 'leads chahiye', 'enquiries chahiye', 'customer chahiye', 'लीड', 'लीड्स', 'लीड जनरेशन', 'ज़्यादा पूछताछ', 'ग्राहक चाहिए'],
      catalogKey: 'ads', route: '/service-leads', inquiry: 'Lead Generation',
      label: ['Lead generation', 'लीड जनरेशन', 'Lead generation'],
      description: [
        'We can help bring together campaigns, landing pages and enquiry forms so interested customers have a clear way to reach you.',
        'हम कैंपेन, लैंडिंग पेज और पूछताछ फ़ॉर्म को साथ जोड़ सकते हैं, ताकि इच्छुक ग्राहक आपसे आसानी से संपर्क कर सकें।',
        'Hum campaigns, landing pages aur enquiry forms ko connect kar sakte hain, taaki interested customers aasani se aapse baat kar sakein.'
      ],
      followUp: [
        'What do you sell, and what would a useful enquiry look like for your business?',
        'आप क्या बेचते हैं और आपके बिज़नेस के लिए कैसी पूछताछ उपयोगी होगी?',
        'Aap kya bechte hain, aur aapke business ke liye kaunsi enquiry useful hogi?'
      ]
    },
    automation: {
      aliases: ['automation', 'automate', 'automated replies', 'whatsapp automation', 'chatbot', 'auto reply', 'ऑटोमेशन', 'ऑटो रिप्लाई', 'चैटबॉट', 'स्वचालन'],
      inquiry: 'Marketing Automation', label: ['Automation', 'ऑटोमेशन', 'Automation'],
      description: [
        'The team can discuss automation for enquiries, follow-ups or lead routing.',
        'पूछताछ, फ़ॉलो-अप या सही टीम तक लीड पहुँचाने के ऑटोमेशन पर हमारी टीम आपके साथ बात कर सकती है।',
        'Team aapse enquiries, follow-ups ya lead routing ke automation par baat kar sakti hai.'
      ],
      followUp: [
        'Which step takes the most time today, and where do those enquiries come in?',
        'अभी किस काम में सबसे ज़्यादा समय लगता है और पूछताछ कहाँ आती है?',
        'Abhi kis kaam mein sabse zyada time lagta hai, aur enquiries kahan aati hain?'
      ]
    }
  };

  const words = {
    price: ['price', 'pricing', 'cost', 'charges', 'charge', 'quote', 'quotation', 'how much', 'rate', 'fees', 'budget', 'package', 'packages', 'plan', 'plans', 'kitna', 'kitni', 'kharcha', 'keemat', 'kimat', 'paise', 'daam', 'kitne', 'daar', 'कीमत', 'खर्च', 'कितना', 'कितनी', 'बजट', 'रेट', 'पैकेज', 'पैसे', 'चार्ज'],
    detail: ['include', 'includes', 'included', 'inclusions', 'what do i get', 'deliverables', 'shoot', 'editing', 'trial reels', 'stories', 'kya milega', 'kya milta', 'क्या मिलेगा', 'क्या मिलता', 'शूट', 'एडिटिंग', 'स्टोरी'],
    time: ['how long', 'timeline', 'delivery', 'time frame', 'turnaround', 'kitna time', 'kitna samay', 'kab milega', 'kab tak', 'kitne din', 'कितना समय', 'कब तक', 'कितने दिन'],
    promo: ['promotion', 'promote', 'promotional campaign', 'marketing', 'business grow', 'brand awareness', 'campaign', 'reach chahiye', 'prachar', 'parchar', 'प्रचार', 'प्रमोशन', 'मार्केटिंग', 'कैम्पेन', 'कैंपेन'],
    offer: ['discount', 'coupon', 'concession', 'offer', 'offers', 'christmas offer', 'chhoot', 'छूट', 'ऑफ़र', 'ऑफर', 'डिस्काउंट'],
    human: ['human', 'talk to team', 'talk to your team', 'talk to someone', 'talk to an advisor', 'call me', 'free demo', 'book a call', 'consultation', 'consult', 'team se baat', 'call karna', 'call karo', 'insaan', 'इंसान', 'कॉल करें', 'बात करनी', 'टीम से बात', 'सलाह'],
    location: ['office', 'address', 'where are you based', 'where are you located', 'your location', 'aap kahan ho', 'aap kaha ho', 'pata batao', 'आप कहाँ हैं', 'आप कहां हैं', 'ऑफिस', 'कार्यालय', 'आपका पता'],
    contact: ['contact number', 'phone number', 'whatsapp number', 'how can i contact', 'your whatsapp', 'whatsapp', 'contact kaise', 'aapka number', 'व्हाट्सऐप', 'व्हाट्सएप', 'नंबर', 'आपसे संपर्क'],
    services: ['what do you do', 'what do you offer', 'what services do you offer', 'your services', 'which services', 'what services', 'list services', 'services', 'kya services', 'kya kya karte', 'सेवाएँ', 'सेवाएं', 'क्या करते', 'कौन सी सेवाएं'],
    store: ['online store', 'shopping cart', 'cart', 'payment gateway', 'online payment', 'ecommerce', 'e commerce', 'shopify', 'products online', 'ऑनलाइन स्टोर', 'ऑनलाइन पेमेंट', 'ऑनलाइन बेच', 'प्रोडक्ट ऑनलाइन', 'ई कॉमर्स'],
    landing: ['landing page', 'one page', 'single page', 'campaign page', 'लैंडिंग पेज', 'एक पेज'],
    business: ['business website', 'business site', 'site for my business', 'company website', 'business site chahiye', 'business ke liye', 'बिज़नेस वेबसाइट', 'बिजनेस वेबसाइट', 'कंपनी की वेबसाइट'],
    thanks: ['thanks', 'thank you', 'shukriya', 'dhanyavaad', 'धन्यवाद', 'शुक्रिया'],
    greeting: ['hi', 'hello', 'hey', 'namaste', 'namaskar', 'नमस्ते', 'नमस्कार'],
    english: ['english', 'in english', 'reply in english'],
    hindi: ['hindi', 'in hindi', 'hindi mein', 'हिंदी', 'हिन्दी', 'हिंदी में', 'हिन्दी में'],
    hinglish: ['hinglish', 'roman hindi', 'हिंग्लिश'],
    latinHindi: ['mujhe', 'muje', 'mein', 'meri', 'mera', 'hume', 'hamara', 'aap', 'apna', 'apne', 'banwana', 'banwani', 'banvani', 'banvana', 'banana', 'karwana', 'karna', 'karo', 'chahiye', 'chahie', 'chahta', 'hai', 'hain', 'ka', 'kaise', 'kitna', 'kitne', 'kitni', 'kya', 'batao', 'kab tak', 'ke liye', 'hogi', 'samay', 'bikri', 'nahi', 'nahin', 'shukriya', 'namaste'],
    salesGoal: ['sales', 'more sales', 'sales chahiye', 'sell more', 'bikri', 'बिक्री', 'ज़्यादा बिक्री'],
    leadsGoal: ['leads', 'enquiries', 'inquiries', 'more customers', 'lead chahiye', 'grahak', 'पूछताछ', 'ग्राहक'],
    reachGoal: ['reach', 'awareness', 'brand awareness', 'reach chahiye', 'पहचान', 'ज़्यादा लोगों तक'],
    searchGoal: ['visibility', 'organic', 'google visibility', 'गूगल पर दिखना', 'ऑर्गेनिक'],
    businessDetails: ['for my', 'i run', 'i own', 'we run', 'we own', 'our business', 'restaurant', 'clinic', 'salon', 'bakery', 'agency', 'shop', 'school', 'ke liye', 'मेरा बिज़नेस', 'के लिए', 'रेस्टोरेंट', 'दुकान', 'क्लिनिक', 'स्कूल']
  };

  const amount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  const planAliases = [
    ['social essentials', 'सोशल एसेंशियल्स', 'essentials', 'एसेंशियल्स'],
    ['social growth', 'सोशल ग्रोथ', 'growth', 'ग्रोथ'],
    ['social pro', 'सोशल प्रो', 'pro', 'प्रो']
  ];
  const quickHints = new Set([...Object.keys(serviceTopics), 'pricing', 'human', 'promo']);
  const languageIndex = { en: 0, hi: 1, 'hi-Latn': 2 };

  function normalize(message) {
    return String(message ?? '').normalize('NFKC').toLowerCase()
      .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ').trim();
  }

  function has(phrase, candidates) {
    const padded = ' ' + phrase + ' ';
    return candidates.some(candidate => padded.includes(' ' + candidate + ' '));
  }

  function greeting(date = new Date()) {
    const hour = date.getHours();
    const period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    return 'Good ' + period + '! Welcome to Digi Shatakshi. How may I help you today?';
  }

  function detectLanguage(raw, question, previous) {
    const pureLanguage = [words.english, words.hindi, words.hinglish].findIndex(options => options.includes(question));
    if (pureLanguage !== -1) return ['en', 'hi', 'hi-Latn'][pureLanguage];
    if (has(question, ['in english', 'reply in english'])) return 'en';
    if (has(question, ['in hindi', 'hindi mein', 'हिंदी में', 'हिन्दी में'])) return 'hi';
    if (/\p{Script=Devanagari}/u.test(raw)) return 'hi';
    if (has(question, words.latinHindi)) return 'hi-Latn';
    if (question.split(' ').length <= 2) return previous;
    return 'en';
  }

  function relevantTopics(raw, question) {
    // A rejected option should not outrank what the visitor asks for next.
    const clauses = raw.split(/[,;.!?।\n]|\b(?:but|instead|lekin|magar)\b|लेकिन|बल्कि/iu).map(normalize);
    const affirmative = clauses.filter(clause => !has(clause, [
      'don t want', 'do not want', 'don t need', 'do not need', 'not interested in',
      'no need for', 'nahi chahiye', 'nahin chahiye', 'nahi karwana', 'नहीं चाहिए', 'नहीं करवाना'
    ])).join(' ');
    const candidate = clauses.length ? affirmative : question;
    let keys = Object.keys(serviceTopics).filter(key => has(candidate, serviceTopics[key].aliases));
    if (keys.includes('ads') && has(candidate, ['instagram ads', 'facebook ads', 'इंस्टाग्राम विज्ञापन', 'फेसबुक विज्ञापन']) &&
        !has(candidate, ['social media', 'smm', 'reels', 'posts', 'सोशल मीडिया', 'रील्स', 'पोस्ट'])) {
      keys = keys.filter(key => key !== 'social');
    }
    if (keys.includes('content') && has(candidate, ['website content', 'वेबसाइट का कंटेंट']) &&
        !has(candidate, ['website development', 'website banwana', 'new website', 'वेबसाइट बनवानी'])) {
      keys = keys.filter(key => key !== 'website');
    }
    if (keys.includes('seo') && has(candidate, [
      'website seo', 'website ka seo', 'website ke liye seo', 'seo for my website', 'seo for our website',
      'seo for website', 'वेबसाइट का एसईओ', 'वेबसाइट के लिए एसईओ'
    ]) && !has(candidate, ['new website', 'build a website', 'website banwana', 'नई वेबसाइट'])) {
      keys = keys.filter(key => key !== 'website');
    }
    if (keys.includes('automation') && !has(candidate, ['lead generation', 'lead gen', 'लीड जनरेशन']) &&
        has(candidate, ['lead automation', 'automate leads', 'automated lead routing'])) {
      keys = keys.filter(key => key !== 'leads');
    }
    return keys;
  }

  function createConversation(catalog) {
    const services = catalog?.services ?? [];
    const socialPlans = services.find(service => service.categoryKey === 'smm')?.packages ?? [];
    let language = 'en';
    let activeTopic = '';
    let activePlan = null;
    let waitingForPromotionGoal = false;
    let waitingForWebsiteBusiness = false;

    const pick = (...translations) => translations[languageIndex[language]];
    const label = topic => pick(...serviceTopics[topic].label);
    const result = (text, actions = []) => ({ text, language, actions });
    const serviceFor = topic => services.find(service => service.categoryKey === serviceTopics[topic]?.catalogKey);

    function quote(topic, plan) {
      return {
        type: 'quote', label: pick('Talk to our team', 'हमारी टीम से बात करें', 'Team se baat karein'),
        service: serviceTopics[topic]?.inquiry ?? serviceFor(topic)?.inquiryService, plan: plan?.name
      };
    }

    function serviceLink(topic) {
      const route = serviceTopics[topic]?.route;
      return route && { type: 'service', label: label(topic), route };
    }

    function pricing(topic) {
      return {
        type: 'pricing', label: pick('View pricing', 'कीमतें देखें', 'Pricing dekhein'),
        slug: serviceFor(topic)?.slug
      };
    }

    function whatsapp() {
      return { type: 'whatsapp', label: pick('Open WhatsApp', 'WhatsApp खोलें', 'WhatsApp kholein') };
    }

    function prompt(topic) {
      return { type: 'prompt', label: label(topic), prompt: label(topic), hint: topic };
    }

    function plansIn(question, allowShortNames) {
      return socialPlans.filter((plan, index) => {
        const aliases = planAliases[index] ?? [];
        return has(question, [normalize(plan.name), ...aliases.slice(0, 2)]) ||
          (allowShortNames && has(question, aliases.slice(2)));
      });
    }

    function planLine(plan) {
      const feed = plan.feedPosts;
      return pick(
        `${plan.name} (${amount.format(plan.price)}): ${feed.total} feed posts (${feed.reels} reels, ${feed.carousels} carousels, ${feed.staticCreatives} static creatives), plus ${plan.storiesPerWeek} Stories a week.`,
        `${plan.name} (${amount.format(plan.price)}): ${feed.total} फ़ीड पोस्ट (${feed.reels} रील्स, ${feed.carousels} कैरोसेल और ${feed.staticCreatives} स्टैटिक क्रिएटिव), साथ में हर हफ़्ते ${plan.storiesPerWeek} स्टोरीज़।`,
        `${plan.name} (${amount.format(plan.price)}): ${feed.total} feed posts (${feed.reels} reels, ${feed.carousels} carousels aur ${feed.staticCreatives} static creatives), aur har hafte ${plan.storiesPerWeek} Stories.`
      );
    }

    function planDetail(plan) {
      const details = [planLine(plan)];
      if (plan.shootAndEditing) details.push(pick(plan.shootAndEditing, 'प्रोफ़ेशनल शूट और एडिटिंग शामिल हैं।', 'Professional shoot aur editing included hain.'));
      if (plan.trialReelsAdditional) {
        const count = plan.trialReelsAdditional;
        details.push(pick(
          `${count} extra Trial Reels are separate from the feed posts.`,
          `${count} अतिरिक्त ट्रायल रील्स फ़ीड पोस्ट से अलग हैं।`,
          `${count} extra Trial Reels feed posts se alag hain.`
        ));
      }
      if (plan.storyExtras.length) {
        const extras = plan.storyExtras.join(' and ');
        details.push(pick(`Stories include ${extras}.`, `स्टोरीज़ में ${extras} शामिल हैं।`, `Stories mein ${extras} included hain.`));
      }
      return details.join(' ');
    }

    function priceSummary() {
      return socialPlans.map(plan => plan.name + ' ' + amount.format(plan.price)).join(' · ');
    }

    function quoteExplanation(topic) {
      return pick(
        `${label(topic)} is priced by quote. We confirm the price once we know what you need.`,
        `${label(topic)} की कीमत काम की ज़रूरत समझने के बाद हमारी टीम बताएगी।`,
        `${label(topic)} ka quote aapki requirements samajhne ke baad team confirm karegi.`
      );
    }

    function websiteScope(question) {
      if (has(question, words.store)) return pick(
        'For an online store, checkout and product setup affect the scope. Roughly how many products are you starting with, and do you need online payments?',
        'ऑनलाइन स्टोर में उत्पादों की संख्या और चेकआउट से काम का दायरा तय होता है। शुरुआत में लगभग कितने उत्पाद होंगे और क्या ऑनलाइन पेमेंट चाहिए?',
        'Online store mein products aur checkout se scope decide hota hai. Shuruaat mein kitne products hain, aur online payments chahiye?'
      );
      if (has(question, words.landing)) return pick(
        'A landing page can focus on one offer and one next step. What should visitors do after they see the offer?',
        'लैंडिंग पेज पर एक ऑफ़र और अगला कदम साफ़ रख सकते हैं। आप चाहते हैं कि ऑफ़र देखकर लोग क्या करें?',
        'Landing page ek offer aur ek next step par focus kar sakta hai. Offer dekhne ke baad visitors kya karein?'
      );
      if (has(question, words.business)) return pick(
        'A business site can show your main services and make enquiries simple. What kind of business is it, and how should visitors contact you?',
        'बिज़नेस वेबसाइट पर आपकी मुख्य सेवाएँ और संपर्क का तरीका साफ़ दिख सकता है। आपका बिज़नेस किस तरह का है और ग्राहक आपसे कैसे संपर्क करें?',
        'Business website par main services aur contact ka tareeka clear rakh sakte hain. Aapka business kis type ka hai, aur customers kaise contact karein?'
      );
      return '';
    }

    function respond(message, intentHint) {
      const raw = String(message ?? '');
      const question = normalize(raw);
      if (!question) return result(pick(
        'Try a service shortcut or tell me what your business needs help with.',
        'किसी सेवा का बटन चुनें या बताइए कि आपके बिज़नेस को किस चीज़ में मदद चाहिए।',
        'Service ka shortcut choose karein ya batayein aapke business ko kis cheez mein help chahiye.'
      ));
      const hint = quickHints.has(intentHint) ? intentHint : '';
      if (!hint) language = detectLanguage(raw, question, language);

      if ([...words.english, ...words.hindi, ...words.hinglish].includes(question)) {
        return result(pick('Of course. What would you like help with?', 'ज़रूर। आपको किस चीज़ में मदद चाहिए?', 'Zaroor. Aapko kis cheez mein help chahiye?'));
      }

      const isPrice = hint === 'pricing' || has(question, words.price);
      const isDetail = has(question, words.detail);
      const isTimeline = has(question, words.time);
      const isWebsiteScope = activeTopic === 'website' && [words.store, words.landing, words.business].some(group => has(question, group));
      const topics = serviceTopics[hint] ? [hint] : relevantTopics(raw, question);
      if (!topics.length && !hint && waitingForPromotionGoal) {
        if (has(question, words.salesGoal)) topics.push('ads');
        else if (has(question, words.leadsGoal)) topics.push('leads');
        else if (has(question, words.searchGoal)) topics.push('seo');
        else if (has(question, words.reachGoal)) topics.push('social');
      }
      const shortPlan = question.split(' ').length === 1 || topics.includes('social') || activeTopic === 'social';
      const plans = plansIn(question, shortPlan);
      if (plans.length && !topics.includes('social')) topics.push('social');
      const context = !hint || hint === 'human';
      const topic = topics[0] || ((context && (isPrice || isDetail || isTimeline || isWebsiteScope || has(question, words.human))) ? activeTopic : '');
      const plan = topic === 'social' ? (plans[0] || (activeTopic === 'social' ? activePlan : null)) : null;

      if (topics.length === 1) {
        activePlan = topic === 'social' && plans.length === 1 ? plans[0] : null;
        activeTopic = topic;
        waitingForPromotionGoal = false;
        if (topic !== 'website') waitingForWebsiteBusiness = false;
      }

      if (!hint && has(question, words.location)) return result(pick(
        'Our office is at 2/45, Vibhav Khand, Gomti Nagar, Lucknow, Uttar Pradesh 226010. You can check with the team before visiting.',
        'हमारा कार्यालय 2/45, विभव खंड, गोमती नगर, लखनऊ, उत्तर प्रदेश 226010 में है। आने से पहले टीम से बात कर सकते हैं।',
        'Hamara office 2/45, Vibhav Khand, Gomti Nagar, Lucknow, Uttar Pradesh 226010 mein hai. Aane se pehle team se baat kar sakte hain.'
      ), [whatsapp()]);

      if (!hint && !topics.includes('automation') && !topics.includes('website') && has(question, words.contact)) return result(pick(
        'You can reach our team on WhatsApp at +91 73102 51337.',
        'आप हमारी टीम से WhatsApp पर +91 73102 51337 पर बात कर सकते हैं।',
        'Aap hamari team se WhatsApp par +91 73102 51337 par baat kar sakte hain.'
      ), [whatsapp()]);

      if (hint === 'human' || has(question, words.human)) return result(pick(
        'Happy to help you get in touch. Tell the team what you’re working on and what you’d like to achieve.',
        'ज़रूर। हमारी टीम को बताइए कि आप किस काम पर आगे बढ़ना चाहते हैं और आपका लक्ष्य क्या है।',
        'Zaroor. Team ko batayein aap kis kaam par aage badhna chahte hain aur aapka goal kya hai.'
      ), [quote(topic, plan), whatsapp()]);

      if (!has(question, words.services) && has(question, words.offer)) return result(pick(
        'Our team can check whether an offer applies once you share your requirements. Which service are you interested in?',
        'आपकी ज़रूरत समझने के बाद टीम बता सकती है कि कोई ऑफ़र लागू है या नहीं। आपको कौन सी सेवा चाहिए?',
        'Requirements samajhne ke baad team bata sakti hai ki koi offer apply hota hai. Aap kis service mein interested hain?'
      ), [quote(topic || activeTopic, plan || activePlan)]);

      if (topics.length > 1) {
        const names = topics.map(label).join(' · ');
        const summary = isPrice ? topics.map(item => item === 'social' && socialPlans.length ? priceSummary() : quoteExplanation(item)).join('\n') : names;
        return result(summary + '\n\n' + pick('Which would you like to start with?', 'आप किससे शुरुआत करना चाहेंगे?', 'Aap kis se shuru karna chahenge?'), topics.slice(0, 4).map(prompt));
      }

      if (isTimeline) return result(pick(
        'The timeline depends on the scope, when content is ready, and review rounds. Do you have a launch date in mind?',
        'समय काम के दायरे, कंटेंट की तैयारी और समीक्षा पर निर्भर करता है। क्या आपके मन में लॉन्च की कोई तारीख है?',
        'Timeline scope, content ki readiness aur review rounds par depend karti hai. Koi launch date sochi hai?'
      ), [quote(topic, plan)]);

      if (topic === 'social' && (plans.length || isPrice || isDetail)) {
        if (plans.length > 1) return result(plans.map(planDetail).join('\n\n'), [pricing(topic)]);
        if (plan) return result(planDetail(plan), [pricing(topic), quote(topic, plan)]);
        if (socialPlans.length) return result(
          socialPlans.map(planLine).join('\n\n') + '\n\n' + pick(
            'Which package would you like to explore?',
            'आप किस पैकेज के बारे में और जानना चाहेंगे?',
            'Aap kaunsa package aur detail mein dekhna chahenge?'
          ),
          [pricing(topic), quote(topic)]
        );
      }

      if (!topic && waitingForWebsiteBusiness && !hint && has(question, words.businessDetails)) {
        waitingForWebsiteBusiness = false;
        return result(pick(
          'That helps. A business site can start with your key services, location and one clear way for customers to reach you. Do you already have a website, or are we starting from scratch?',
          'यह जानकारी मदद करेगी। बिज़नेस वेबसाइट पर मुख्य सेवाएँ, जगह और संपर्क का एक साफ़ तरीका रख सकते हैं। क्या आपकी पहले से कोई वेबसाइट है या नई बनानी है?',
          'Isse scope samajhne mein help mili. Business site par main services, location aur contact ka ek clear tareeka rakh sakte hain. Aapki pehle se website hai ya bilkul nayi banani hai?'
        ), [serviceLink('website'), quote('website')]);
      }

      if (topic) {
        const service = serviceTopics[topic];
        const scope = topic === 'website' ? websiteScope(question) : '';
        if (topic === 'website' && !has(question, words.store) && !has(question, words.landing)) waitingForWebsiteBusiness = true;
        const intro = isPrice ? quoteExplanation(topic) : scope ? '' : pick(...service.description);
        const text = [intro, scope || pick(...service.followUp)].filter(Boolean).join(' ');
        const link = isPrice && serviceFor(topic) ? pricing(topic) : serviceLink(topic);
        return result(text, [link, quote(topic, plan)].filter(Boolean));
      }

      if (hint === 'promo' || has(question, words.promo)) {
        waitingForPromotionGoal = true;
        const introduction = isPrice ? pick(
          socialPlans.length ? priceSummary() + '. We quote paid ads and SEO after discussing your goals.' : 'We quote campaign costs after discussing your goals.',
          socialPlans.length ? priceSummary() + '। पेड विज्ञापन और एसईओ का खर्च आपका लक्ष्य समझने के बाद बताते हैं।' : 'कैंपेन का खर्च आपका लक्ष्य समझने के बाद बताते हैं।',
          socialPlans.length ? priceSummary() + '. Paid ads aur SEO ka quote goals samajhne ke baad confirm hota hai.' : 'Campaign ka quote goals samajhne ke baad confirm hota hai.'
        ) : pick(
          'We can help promote your business. For regular content, social media is a good place to start. Google or Meta ads can support a specific offer or campaign, and SEO can help people find you through search.',
          'हम आपके बिज़नेस के प्रचार में मदद कर सकते हैं। नियमित कंटेंट के लिए सोशल मीडिया, किसी ऑफ़र के कैंपेन के लिए Google या Meta Ads, और सर्च में दिखने के लिए एसईओ देख सकते हैं।',
          'Hum aapke business ko promote karne mein help kar sakte hain. Regular content ke liye social media, kisi offer ke campaign ke liye Google ya Meta ads, aur search mein dikhne ke liye SEO dekh sakte hain.'
        );
        return result(introduction + ' ' + pick(
          'Are you looking for more visibility, enquiries or sales?',
          'आपका लक्ष्य ज़्यादा लोगों तक पहुँचना, पूछताछ पाना या बिक्री बढ़ाना है?',
          'Aapka main goal reach, enquiries ya sales hai?'
        ), ['social', 'ads', 'seo'].map(prompt));
      }

      if (isPrice) {
        const quotes = pick(
          'Websites, SEO, and paid ads are quoted for your requirements.',
          'वेबसाइट, एसईओ और पेड विज्ञापन की कीमत आपकी ज़रूरत के अनुसार तय होती है।',
          'Websites, SEO aur paid ads ka quote aapki requirements ke hisaab se milta hai.'
        );
        return result([priceSummary(), quotes].filter(Boolean).join('\n\n'), [pricing('social'), quote()]);
      }

      if (has(question, words.services)) return result(pick(
        'We help with websites, social media, SEO, paid ads, branding, content, lead generation and marketing automation. Which would help your business right now?',
        'हम वेबसाइट, सोशल मीडिया, एसईओ, पेड विज्ञापन, ब्रांडिंग, कंटेंट, लीड जनरेशन और मार्केटिंग ऑटोमेशन में मदद करते हैं। अभी आपके बिज़नेस को किस चीज़ की ज़रूरत है?',
        'Hum websites, social media, SEO, paid ads, branding, content, lead generation aur marketing automation mein help karte hain. Abhi aapko kis cheez ki zaroorat hai?'
      ), ['website', 'social', 'seo', 'ads'].map(prompt));

      if (question.split(' ').length <= 4 && has(question, words.thanks)) return result(pick('You’re welcome!', 'आपका स्वागत है!', 'Kabhi bhi!'));
      if (question.split(' ').length <= 3 && has(question, words.greeting)) return result(pick(
        'Hi! What can I help you with today?',
        'नमस्ते! आज मैं आपकी किस तरह मदद कर सकता हूँ?',
        'Namaste! Aaj main aapki kis cheez mein help kar sakta hoon?'
      ));

      return result(pick(
        'Could you tell me a little about your business and what you want customers to do? I can point you to the right service or help you reach our team.',
        'अपने बिज़नेस के बारे में थोड़ा बताइए और आप ग्राहकों से क्या करवाना चाहते हैं। मैं सही सेवा चुनने या टीम से बात करने में मदद कर सकता हूँ।',
        'Apne business ke baare mein thoda batayein aur customers se kya action chahte hain. Main aapko sahi service ya team tak pahunchne mein help kar sakta hoon.'
      ), [quote(activeTopic, activePlan)]);
    }

    return { respond };
  }

  global.DigiSaathiAnswers = Object.freeze({ greeting, createConversation });
})(window);
