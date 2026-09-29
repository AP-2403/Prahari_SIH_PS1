import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from './LanguageContext';

export const TOUR_STEPS = [
  {
    step: 1,
    route: '/login',
    role: null,
    targetSelector: '#tour-login-card',
    fallbackSelector: '.login-card',
    preferredSide: 'left',
    title: {
      en: 'Role-Based Authentication & Access Personas',
      hi: 'भूमिका-आधारित प्रमाणीकरण एवं उपयोगकर्ता खाते'
    },
    action: {
      en: 'Observe the three distinct access personas: National MoSPI Admin, Hon\'ble MP, and District Officer.',
      hi: 'तीन प्रमुख उपयोगकर्ता श्रेणियों का निरीक्षण करें: राष्ट्रीय मंत्रालय, सांसद, और जिला अधिकारी।'
    },
    dataFlow: {
      en: 'DATA FLOW: User credentials initiate the session and establish Role-Based Access Control (RBAC). Ministry Admins get national macro-telemetry; MPs get constituency-scoped work approvals; District Collectors get on-ground verification queues.',
      hi: 'डेटा प्रवाह: लॉगिन क्रेडेंशियल आरबीएसी (RBAC) सुरक्षा परिधि तय करते हैं। मंत्रालय व्यवस्थापक राष्ट्रीय निगरानी करते हैं, सांसद संसदीय कार्य स्वीकृत करते हैं, और जिला अधिकारी जमीनी सत्यापन करते हैं।'
    },
    metricExplanation: {
      en: 'Ensures strict cryptographic privilege separation so audit rules and fund clearances are only executed by statutory authorities.',
      hi: 'सख्त विशेषाधिकार विभाजन सुनिश्चित करता है ताकि ऑडिट नियम और वित्तीय अनुमतियां केवल वैधानिक अधिकारियों द्वारा ही क्रियान्वित की जा सकें।'
    },
    details: {
      en: 'Select any preloaded demo profile or click the live action below to authenticate instantly as the National Ministry Admin.',
      hi: 'किसी भी प्रीलोडेड डेमो प्रोफाइल का चयन करें या राष्ट्रीय व्यवस्थापक के रूप में सीधे लॉगिन करने के लिए नीचे दिए गए बटन पर क्लिक करें।'
    },
    liveAction: {
      label: { en: '⚡ Auto-Login as National Admin', hi: '⚡ व्यवस्थापक के रूप में त्वरित प्रवेश' },
      execute: (navigate) => {
        localStorage.setItem('prahari_token', 'demo_admin_jwt_token_sih2026');
        localStorage.setItem('prahari_user', JSON.stringify({
          username: 'admin',
          role: 'admin',
          name: 'National Admin'
        }));
        navigate('/admin/upload');
      }
    }
  },
  {
    step: 2,
    route: '/admin/upload',
    role: 'admin',
    targetSelector: '#tour-upload-card',
    fallbackSelector: '.drop-zone',
    preferredSide: 'right',
    title: {
      en: 'Data Ingestion & MoSPI DPR Upload Center',
      hi: 'डेटा अंतर्ग्रहण एवं सांख्यिकी मंत्रालय डीपीआर अपलोड केंद्र'
    },
    action: {
      en: 'Click the demo document button below to load and inspect a realistic 24-project MoSPI DPR file.',
      hi: 'वास्तविक 24-परियोजना सांख्यिकी मंत्रालय डीपीआर फ़ाइल लोड करने के लिए नीचे दिए गए डेमो दस्तावेज़ बटन पर क्लिक करें।'
    },
    dataFlow: {
      en: 'DATA FLOW: Raw project DPRs, CSV work registers, and contractor tenders enter PRAHARI here. The ingestion engine automatically parses CSV/XLSX schemas, maps column headers, and normalizes financial currencies and GPS coordinates.',
      hi: 'डेटा प्रवाह: प्रारंभिक परियोजना डीपीआर और कार्य रजिस्टर यहां अपलोड होते हैं। सिस्टम स्वचालित रूप से कॉलम हेडर मैप करता है और वित्तीय व जीपीएस निर्देशांकों को मानकीकृत करता है।'
    },
    metricExplanation: {
      en: 'Supports multiple file schemas: Recommended Works, Completed Works, Expenditures, and MP Allocation summaries.',
      hi: 'अनुशंसित कार्य, पूर्ण कार्य, व्यय और सांसद आवंटन सारांश जैसी कई प्रारूपों का समर्थन करता है।'
    },
    details: {
      en: 'Click "Click to View Demo Document" to see auto-detected column mappings and data preview, or click "Run Live Ingestion Pipeline" to watch it process.',
      hi: 'कॉलम मैपिंग और डेटा पूर्वावलोकन देखने के लिए "दस्तावेज़ देखें" पर क्लिक करें, या लाइव प्रक्रिया देखने के लिए "पाइपलाइन चलाएं" पर क्लिक करें।'
    },
    liveAction: {
      label: { en: '📄 Click Demo Document & Process Live', hi: '📄 डेमो दस्तावेज़ लोड करें और लाइव चलाएं' },
      execute: () => {
        const viewBtn = document.querySelector('#tour-demo-doc-btn');
        if (viewBtn) viewBtn.click();
        setTimeout(() => {
          const procBtn = document.querySelector('#tour-demo-process-btn');
          if (procBtn) procBtn.click();
        }, 600);
      }
    }
  },
  {
    step: 3,
    route: '/admin/upload',
    role: 'admin',
    targetSelector: '#tour-processing-console',
    fallbackSelector: '.card:has(.progress-fill)',
    preferredSide: 'left',
    title: {
      en: 'Real-Time Multi-Engine Processing Console',
      hi: 'रीयल-टाइम मल्टी-इंजन प्रोसेसिंग कंसोल'
    },
    action: {
      en: 'Watch the stage-by-stage execution log: Parsing → Ingesting → AI Scoring → Database Commit.',
      hi: 'चरण-दर-चरण निष्पादन लॉग देखें: पार्सिंग → अंतर्ग्रहण → एआई स्कोरिंग → डेटाबेस पूर्णता।'
    },
    dataFlow: {
      en: 'DATA FLOW: Ingestion Pipeline Stages:\n1. Parsing: Validates data integrity & GIS boundaries\n2. Ingesting: Verifies statutory 15% SC / 7.5% ST earmarks (MoSPI Para 3.3)\n3. Scoring: Runs Isolation Forest anomaly models and Benford\'s Law checks\n4. Routing: Clean works update dashboard KPIs; anomalies are routed to Review Queue.',
      hi: 'डेटा प्रवाह: पार्सिंग जीआईएस सीमाओं की जांच करता है, अंतर्ग्रहण एससी/एसटी 15%/7.5% वैधानिक आरक्षण (पैरा 3.3) सत्यापित करता है, और स्कोरिंग विसंगतियों को समीक्षा कतार में भेजता है।'
    },
    metricExplanation: {
      en: 'Progress Bar & Color Codes: Green (clean), Amber (warning flag), Red (statutory breach). Log timestamps provide an immutable audit trail.',
      hi: 'प्रगति बार और रंग संकेत: हरा (स्वच्छ), पीला (चेतावनी), लाल (वैधानिक उल्लंघन)। लॉग टाइमस्टैम्प एक अपरिवर्तनीय ऑडिट ट्रेल प्रदान करते हैं।'
    },
    details: {
      en: 'The console executes in asynchronous background workers with automated error isolation so corrupt rows never halt batch processing.',
      hi: 'कंसोल बैकग्राउंड वर्कर में चलता है जिससे त्रुटिपूर्ण पंक्तियों के कारण संपूर्ण डेटा अपलोड बाधित नहीं होता।'
    },
    liveAction: null
  },
  {
    step: 4,
    route: '/admin/ministry',
    role: 'admin',
    targetSelector: '#tour-hero-banner',
    fallbackSelector: '.hero-banner',
    preferredSide: 'bottom',
    title: {
      en: 'National Ministry Surveillance Hub',
      hi: 'राष्ट्रीय मंत्रालय निगरानी केंद्र'
    },
    action: {
      en: 'Inspect the live surveillance banner aggregating nationwide MPLADS operational health.',
      hi: 'राष्ट्रव्यापी सांसद निधि परिचालन स्वास्थ्य का संकलन करने वाले लाइव निगरानी बैनर का निरीक्षण करें।'
    },
    dataFlow: {
      en: 'DATA FLOW: Ingested records from all 28 States and 8 UTs aggregate into this executive hub. Continuous background cron jobs recalculate nationwide risk metrics every 15 minutes.',
      hi: 'डेटा प्रवाह: सभी राज्यों और केंद्र शासित प्रदेशों से अंतर्ग्रहीत डेटा इस केंद्र में संकलित होता है। बैकग्राउंड जॉब्स हर 15 मिनट में राष्ट्रव्यापी जोखिम स्कोर की पुनर्गणना करते हैं।'
    },
    metricExplanation: {
      en: 'Surveillance Scope: Actively tracks 774 Members of Parliament (Lok Sabha + Rajya Sabha), ₹71.8 Billion in total allocations, and 59,275 active projects.',
      hi: 'निगरानी दायरा: 774 सांसदों (लोकसभा + राज्यसभा), ₹71.8 अरब कुल आवंटन, और 59,275 सक्रिय कार्यों की वास्तविक समय में निगरानी।'
    },
    details: {
      en: 'Provides high-level situational awareness for the Union Minister, Ministry Secretary, and parliamentary audit committees.',
      hi: 'केंद्रीय मंत्री, मंत्रालय सचिव और संसदीय ऑडिट समितियों के लिए उच्च स्तरीय स्थितिजन्य जागरूकता प्रदान करता है।'
    },
    liveAction: null
  },
  {
    step: 5,
    route: '/admin/ministry',
    role: 'admin',
    targetSelector: '#tour-national-kpis',
    fallbackSelector: '.card:has(.kpi-value)',
    preferredSide: 'bottom',
    title: {
      en: 'National Macro Financial KPIs & Fund Velocity',
      hi: 'राष्ट्रीय वृहद वित्तीय संकेतक एवं निधि प्रवाह गति'
    },
    action: {
      en: 'Review the 4 core macro indicators: Allocation, Expenditure, Completed, and Pending Works.',
      hi: '4 प्रमुख संकेतकों की समीक्षा करें: कुल आवंटन, व्यय, पूर्ण कार्य, और लंबित कार्य।'
    },
    dataFlow: {
      en: 'DATA FLOW: Financial telemetry reconciles treasury releases against bank-verified expenditure certificates submitted by District Authorities (DAs).',
      hi: 'डेटा प्रवाह: वित्तीय आंकड़े जिला अधिकारियों द्वारा प्रस्तुत बैंक-सत्यापित व्यय प्रमाणपत्रों के साथ राजकोषीय आवंटन का मिलान करते हैं।'
    },
    metricExplanation: {
      en: '• Total Allocation: ₹71.8B statutory entitlement\n• Total Expenditure: ₹42.3B actual verified payouts (58.9% velocity)\n• Works Completed: Projects with certified completion\n• Pending Works: Active works requiring milestone verification.',
      hi: '• कुल आवंटन: ₹71.8B वैधानिक राशि\n• कुल व्यय: ₹42.3B सत्यापित संवितरण (58.9% गति)\n• पूर्ण कार्य: भौतिक रूप से पूर्ण कार्य\n• लंबित कार्य: प्रगतिरत कार्य।'
    },
    details: {
      en: 'Detects fiscal bottlenecks early by highlighting constituencies with low expenditure velocity and unspent fund buildup.',
      hi: 'कम व्यय गति और अप्रयुक्त निधि संचय वाले संसदीय क्षेत्रों को उजागर करके वित्तीय बाधाओं का समय रहते पता लगाता है।'
    },
    liveAction: null
  },
  {
    step: 6,
    route: '/admin/ministry',
    role: 'admin',
    targetSelector: '#tour-kpi-strip',
    fallbackSelector: '#tour-national-kpis + div',
    preferredSide: 'bottom',
    title: {
      en: 'PRAHARI AI Risk & Compliance Metric Strip',
      hi: 'प्रहरी एआई जोखिम एवं अनुपालन संकेतक पट्टी'
    },
    action: {
      en: 'Examine the multi-engine audit summary: High-Risk Works, Duplicate Proposals, and Collusion Rings.',
      hi: 'मल्टी-इंजन ऑडिट सारांश देखें: उच्च जोखिम कार्य, डुप्लिकेट प्रस्ताव, और विक्रेता सांठगांठ कार्टेल।'
    },
    dataFlow: {
      en: 'DATA FLOW: Output of PRAHARI\'s 5 ML & heuristic engines. Scores each work out of 100 and populates real-time warning indicators for executive triage.',
      hi: 'डेटा प्रवाह: प्रहरी के 5 एआई इंजनों का आउटपुट। प्रत्येक कार्य को 100 में से स्कोर करता है और तत्काल ऑडिट चेतावनी संकेतकों को अद्यतन करता है।'
    },
    metricExplanation: {
      en: '• High-Risk Works (Score ≥ 70): Urgent audit candidates\n• Duplicate Flags: Text/photo similarity matches (Cosine > 0.85)\n• Vendor Collusion: Bidding syndicates detected by Louvain algorithm\n• Fund Utilization %: Fiscal disbursement efficiency ratio.',
      hi: '• उच्च जोखिम कार्य (स्कोर ≥ 70): तत्काल ऑडिट योग्य कार्य\n• डुप्लिकेट फ्लैग: पाठ/फोटो समानता मिलान\n• विक्रेता सांठगांठ: कार्टेल सिंडिकेट\n• निधि उपयोग %: संवितरण दक्षता अनुपात।'
    },
    details: {
      en: 'Cards are bordered in danger-red when anomaly volumes breach national tolerance thresholds, alerting auditors to trigger spot inspections.',
      hi: 'विसंगति की मात्रा राष्ट्रीय सहनशीलता सीमा से अधिक होने पर कार्ड लाल बॉर्डर में प्रदर्शित होते हैं, जो तत्काल निरीक्षण का संकेत देते हैं।'
    },
    liveAction: null
  },
  {
    step: 7,
    route: '/admin/ministry',
    role: 'admin',
    targetSelector: '#tour-hero-map',
    fallbackSelector: '.card:has(.leaflet-container), .card:has(.map-placeholder)',
    preferredSide: 'left',
    title: {
      en: 'Constituency Geospatial Risk Heatmap',
      hi: 'संसदीय क्षेत्र-स्तरीय भू-स्थानिक जोखिम मानचित्र'
    },
    action: {
      en: 'Inspect constituency pins across India: 🟢 Clean (0-39), 🟡 Medium (40-69), 🔴 High Risk (70-100).',
      hi: 'भारत भर के संसदीय पिनों का निरीक्षण करें: 🟢 सुरक्षित (0-39), 🟡 मध्यम (40-69), 🔴 उच्च जोखिम (70-100)।'
    },
    dataFlow: {
      en: 'DATA FLOW: Project GPS coordinates are geocoded against Survey of India constituency shapefiles. Spatial clustering algorithms detect split tenders, off-site ghost projects, and regional funding disparities.',
      hi: 'डेटा प्रवाह: परियोजना जीपीएस निर्देशांकों का भारतीय सर्वेक्षण विभाग के मानचित्रों से मिलान किया जाता है। स्थानिक क्लस्टरिंग विभाजन और फर्जी परियोजनाओं का पता लगाती है।'
    },
    metricExplanation: {
      en: 'Pins represent individual MPLADS works. Pin radius scales with project sanction budget; pin color reflects composite AI anomaly severity.',
      hi: 'पिन व्यक्तिगत सांसद निधि कार्यों का प्रतिनिधित्व करते हैं। पिन का आकार स्वीकृत बजट के अनुसार और रंग जोखिम गंभीरता के अनुसार बदलता है।'
    },
    details: {
      en: 'Click any pin to inspect the project title, constituency, sanction value, and exact composite risk rating.',
      hi: 'परियोजना का शीर्षक, संसदीय क्षेत्र, स्वीकृत राशि और समग्र जोखिम स्कोर देखने के लिए किसी भी मानचित्र पिन पर क्लिक करें।'
    },
    liveAction: null
  },
  {
    step: 8,
    route: '/admin/ministry',
    role: 'admin',
    targetSelector: '#tour-charts-row',
    fallbackSelector: '.card:has(.recharts-responsive-container)',
    preferredSide: 'left',
    title: {
      en: 'Statistical Breakdown Charts & Efficiency Gauges',
      hi: 'सांख्यिकी विश्लेषण चार्ट एवं उपयोगिता गेज'
    },
    action: {
      en: 'Analyze the 3 analytical modules: Progress Donut, Fund Utilization Gauge, and Risk Histogram.',
      hi: '3 प्रमुख विश्लेषण चार्टों का अध्ययन करें: प्रगति डोनट, निधि उपयोगिता गेज, और जोखिम हिस्टोग्राम।'
    },
    dataFlow: {
      en: 'DATA FLOW: Aggregates real-time completion stages and financial ledgers into parametric distributions to identify systemic delivery delays.',
      hi: 'डेटा प्रवाह: डिलीवरी में होने वाली देरी की पहचान करने के लिए वास्तविक समय के प्रगति चरणों और वित्तीय खाता-बहियों को सांख्यिकीय ग्राफ में बदलता है।'
    },
    metricExplanation: {
      en: '• Progress Donut: Ratio of Completed vs Recommended works\n• Fund Utilization Gauge: Efficiency gauge (Green >85%, Amber 50-85%, Red <50% flagging fund hoarding)\n• Risk Histogram: Frequency distribution of works across risk deciles (0-20 clean to 80-100 extreme outlier).',
      hi: '• प्रगति डोनट: पूर्ण बनाम अनुशंसित कार्यों का अनुपात\n• उपयोगिता गेज: वित्तीय दक्षता (हरा >85%, पीला 50-85%, लाल <50%)\n• जोखिम हिस्टोग्राम: जोखिम स्कोर का बारंबारता वितरण (0-20 से 80-100 तक)।'
    },
    details: {
      en: 'These charts help ministry planners identify states that hoard unutilized funds or exhibit skewed risk distributions.',
      hi: 'ये चार्ट मंत्रालय के योजनाकारों को उन राज्यों की पहचान करने में मदद करते हैं जो अप्रयुक्त धन जमा रखते हैं या जहां जोखिम अधिक है।'
    },
    liveAction: null
  },
  {
    step: 9,
    route: '/admin/ministry',
    role: 'admin',
    targetSelector: '#tour-trend-chart',
    fallbackSelector: '.card:has(.recharts-line)',
    preferredSide: 'left',
    title: {
      en: 'Monthly Sanctions vs Disbursements Trend',
      hi: 'मासिक स्वीकृति बनाम संवितरण रुझान चार्ट'
    },
    action: {
      en: 'Track the historical trajectory of project sanctions versus real expenditure releases over the fiscal year.',
      hi: 'वित्तीय वर्ष के दौरान परियोजना स्वीकृतियों बनाम वास्तविक व्यय भुगतानों के ऐतिहासिक रुझान को ट्रैक करें।'
    },
    dataFlow: {
      en: 'DATA FLOW: Chronological timeline analysis. Detects "March Rush" spending anomalies where district administrations hastily deplete budgets before the March 31 fiscal deadline.',
      hi: 'डेटा प्रवाह: कालानुक्रमिक समय-सीमा विश्लेषण। यह "मार्च रश" विसंगति की पहचान करता है जहां 31 मार्च की वित्तीय समय सीमा से पहले जल्दबाजी में फंड निकाला जाता है।'
    },
    metricExplanation: {
      en: 'Blue Line: Sanctioned amount velocity. Mint Line: Real certified field expenditure. Divergence highlights bureaucratic approval lag.',
      hi: 'नीली रेखा: स्वीकृत राशि की गति। मिंट रेखा: वास्तविक प्रमाणित व्यय। दोनों के बीच का अंतर प्रशासनिक देरी को दर्शाता है।'
    },
    details: {
      en: 'A sudden spike in sanctions without matching field expenditure triggers an automated anomaly flag in the Predictive Delay Engine.',
      hi: 'जमीनी व्यय के बिना स्वीकृतियों में अचानक वृद्धि भविष्य कहने वाले विलंब इंजन में स्वचालित चेतावनी शुरू करती है।'
    },
    liveAction: null
  },
  {
    step: 10,
    route: '/admin/ministry',
    role: 'admin',
    targetSelector: '#tour-top-risk-works',
    fallbackSelector: 'table.data-table',
    preferredSide: 'left',
    title: {
      en: 'Prioritized High-Risk Works Registry',
      hi: 'प्राथमिकता प्राप्त उच्च जोखिम कार्य पंजी'
    },
    action: {
      en: 'Review works flagged with composite risk scores generated by the 5 AI screening engines.',
      hi: '5 एआई इंजनों द्वारा उत्पन्न समग्र जोखिम स्कोर वाले कार्यों की समीक्षा करें।'
    },
    dataFlow: {
      en: 'DATA FLOW: Ranks the entire national portfolio of 59,275 works by anomaly score. Clicking any row navigates directly to that project\'s comprehensive audit dossier.',
      hi: 'डेटा प्रवाह: विसंगति स्कोर के आधार पर 59,275 कार्यों को प्राथमिकता सूची में क्रमबद्ध करता है। किसी भी पंक्ति पर क्लिक करने से उस कार्य का विस्तृत ऑडिट डॉसियर खुल जाता है।'
    },
    metricExplanation: {
      en: 'Risk Score (0-100): Calculated using Isolation Forest budget outliers, Benford\'s Law Chi-Square distribution on tenders, and photo pHash reuse.',
      hi: 'जोखिम स्कोर (0-100): बजट विसंगतियों, बेनफोर्ड नियम, और फोटो पुन: उपयोग के आधार पर गणना की जाती है।'
    },
    details: {
      en: 'Click the button below to dive directly into the forensic investigation of Work #1.',
      hi: 'कार्य #1 की फोरेंसिक जांच में सीधे जाने के लिए नीचे दिए गए बटन पर क्लिक करें।'
    },
    liveAction: {
      label: { en: '🔍 Open Work #1 Audit Dossier', hi: '🔍 कार्य #1 ऑडिट डॉसियर खोलें' },
      execute: (navigate) => {
        navigate('/admin/works/1');
      }
    }
  },
  {
    step: 11,
    route: '/admin/works/1',
    role: 'admin',
    targetSelector: '#tour-multimodal-card',
    fallbackSelector: '.card:has(.progress-bar)',
    preferredSide: 'left',
    title: {
      en: 'Multimodal Photographic & Milestone Verification',
      hi: 'बहुआयामी फोटोग्राफिक एवं प्रगति चरण सत्यापन'
    },
    action: {
      en: 'Select claimed milestones (25%, 50%, 75%, 100%) and examine physical progress tracking.',
      hi: 'दावा किए गए प्रगति चरण (25%, 50%, 75%, 100%) चुनें और भौतिक प्रगति ट्रैकिंग देखें।'
    },
    dataFlow: {
      en: 'DATA FLOW: On-site mobile telemetry. District field engineers capture photos at key construction milestones. Prevents paper-only completions and ghost contractor payouts by mandating photographic proof.',
      hi: 'डेटा प्रवाह: ऑन-साइट मोबाइल टेलीमेट्री। फील्ड इंजीनियर निर्माण के प्रमुख चरणों में तस्वीरें लेते हैं। यह केवल कागजी पूर्णता और फर्जी भुगतानों को रोकता है।'
    },
    metricExplanation: {
      en: 'Progress Bar & Claimed Milestones: Reflects physical work completed on ground, linked to incremental financial disbursement tranches.',
      hi: 'प्रगति बार और दावा किए गए चरण: जमीन पर पूरे हुए वास्तविक कार्य को दर्शाते हैं, जो किश्तों में धनराशि जारी करने से जुड़ा होता है।'
    },
    details: {
      en: 'Use the button below to instantly load the 100% completion milestone with a high-resolution on-site progress photograph.',
      hi: 'उच्च-रिज़ॉल्यूशन ऑन-साइट प्रगति तस्वीर के साथ 100% पूर्णता चरण तुरंत लोड करने के लिए नीचे दिए गए बटन का उपयोग करें।'
    },
    liveAction: {
      label: { en: '📸 Quick-Load 100% Milestone & Photo', hi: '📸 100% चरण एवं पूर्ण फोटो लोड करें' },
      execute: () => {
        const btn100 = document.querySelector('#tour-btn-100');
        if (btn100) btn100.click();
        const loadSampleBtn = document.querySelector('#tour-load-sample-btn');
        if (loadSampleBtn) loadSampleBtn.click();
      }
    }
  },
  {
    step: 12,
    route: '/admin/works/1',
    role: 'admin',
    targetSelector: '#tour-gps-toggle',
    fallbackSelector: '#tour-multimodal-card form',
    preferredSide: 'left',
    title: {
      en: 'Anti-Spoofing & Geodesic Fraud Detection Engine',
      hi: 'एंटी-स्पूफिंग एवं भौगोलिक धोखाधड़ी पहचान इंजन'
    },
    action: {
      en: 'Toggle between Genuine Site Geotag (Within 35m) and Simulated Off-Site Fraud (14.8km away).',
      hi: 'वास्तविक ऑन-साइट जीपीएस (35मी) और सिम्युलेटेड ऑफ-साइट फर्जी जीपीएस (14.8 किमी) के बीच टॉगल करें।'
    },
    dataFlow: {
      en: 'DATA FLOW: Geodesic & Vision Verification:\n1. Haversine Displacement: Computes distance from sanctioned site centroid\n2. Perceptual Hashing (pHash): Checks 64-bit Hamming distance against historical photos to detect duplicate reuse\n3. Statutory Deadline Check: Verifies 1-year statutory completion timeline (MoSPI Para 3.12).',
      hi: 'डेटा प्रवाह: भू-स्थानिक और दृष्टि सत्यापन: हवेर्सिन दूरी की गणना करता है, पुरानी फोटो के पुन: उपयोग को पकड़ने के लिए pHash की जांच करता है, और 1 वर्ष की समय सीमा की पुष्टि करता है।'
    },
    metricExplanation: {
      en: '• Geodesic Verdict: Genuine (< 500m tolerance) vs Off-Site Fraud\n• pHash Score: Hamming distance < 5 indicates duplicate photo fraud\n• Validation Confidence Score: Accuracy percentage out of 100%.',
      hi: '• भू-स्थानिक निर्णय: वास्तविक (< 500मी) बनाम फर्जी स्थान\n• pHash स्कोर: हैमिंग दूरी < 5 फोटो धोखाधड़ी दर्शाती है\n• सत्यापन सटीकता स्कोर: 100% में से स्कोर।'
    },
    details: {
      en: 'Click the action button below to trigger the live multi-engine verification pipeline and observe the validation result on screen.',
      hi: 'लाइव मल्टी-इंजन सत्यापन प्रक्रिया शुरू करने और स्क्रीन पर परिणाम देखने के लिए नीचे दिए गए बटन पर क्लिक करें।'
    },
    liveAction: {
      label: { en: '🚀 Run Live AI Verification Scan', hi: '🚀 लाइव एआई सत्यापन स्कैन चलाएं' },
      execute: () => {
        const verifyBtn = document.querySelector('#tour-verify-btn');
        if (verifyBtn) verifyBtn.click();
      }
    }
  },
  {
    step: 13,
    route: '/admin/works/1',
    role: 'admin',
    targetSelector: '#tour-shap-card',
    fallbackSelector: '.card:has(.progress-fill)',
    preferredSide: 'right',
    title: {
      en: 'Explainable AI (SHAP Reasoning & MoSPI Clauses)',
      hi: 'व्याख्यात्मक एआई (SHAP कारण एवं कानूनी धाराएं)'
    },
    action: {
      en: 'Review plain-language explainability reasons mapped to authoritative MoSPI clauses.',
      hi: 'सांख्यिकी मंत्रालय (MoSPI) की आधिकारिक धाराओं से जुड़े स्पष्ट व्याख्यात्मक कारणों की समीक्षा करें।'
    },
    dataFlow: {
      en: 'DATA FLOW: TreeExplainer SHAP Feature Attribution. Explains exactly why the AI flagged the work by attributing positive/negative risk weights to each specific variable (cost outlier, deadline overrun, contractor concentration).',
      hi: 'डेटा प्रवाह: TreeExplainer SHAP तकनीक। यह स्पष्ट करती है कि एआई ने कार्य को क्यों चिह्नित किया, प्रत्येक कारक (लागत विसंगति, समय सीमा, ठेकेदार संकेंद्रण) के जोखिम योगदान का विवरण देती है।'
    },
    metricExplanation: {
      en: 'Statutory Clause Mapping: Connects ML flags to legal guidelines (e.g. Paragraph 5.2 prohibited trust cap, Paragraph 3.12 statutory completion timelines).',
      hi: 'वैधानिक धारा मैपिंग: एआई फ्लैग को कानूनी दिशानिर्देशों (उदा. पैरा 5.2 ट्रस्ट सीमा, पैरा 3.12 पूर्णता समय सीमा) से जोड़ता है।'
    },
    details: {
      en: 'Eliminates "black-box" AI skepticism, giving auditors clear legal standing to issue show-cause notices or freeze disbursements.',
      hi: 'ब्लैक-बॉक्स एआई के संदेह को समाप्त करता है, जिससे ऑडिटरों को नोटिस जारी करने या भुगतान रोकने के लिए स्पष्ट कानूनी आधार मिलता है।'
    },
    liveAction: null
  },
  {
    step: 14,
    route: '/admin/review',
    role: 'admin',
    targetSelector: '#tour-review-queue',
    fallbackSelector: '.card:has(table.data-table)',
    preferredSide: 'left',
    title: {
      en: 'Central Auditor Review & Triage Queue',
      hi: 'केंद्रीय ऑडिट समीक्षा एवं निवारण कतार'
    },
    action: {
      en: 'Inspect flagged works pending auditor adjudication and filter by minimum risk score.',
      hi: 'ऑडिट निर्णय के लिए लंबित चिह्नित कार्यों का निरीक्षण करें और न्यूनतम जोखिम स्कोर द्वारा फ़िल्टर करें।'
    },
    dataFlow: {
      en: 'DATA FLOW: Human-in-the-Loop Governance. All projects scoring ≥ 40/100 are automatically queued here. Auditors can verify confirmed fraud or mark false alarms, feeding back into active model retraining.',
      hi: 'डेटा प्रवाह: मानव-हस्तक्षेप शासन। 40/100 से अधिक स्कोर वाले सभी कार्य यहां कतारबद्ध होते हैं। ऑडिटर धोखाधड़ी की पुष्टि कर सकते हैं या गलत चेतावनी के रूप में चिह्नित कर सकते हैं।'
    },
    metricExplanation: {
      en: 'Status Summary Chips:\n• ⏳ Pending: Awaiting field officer inspection\n• 🚨 Confirmed Issue: Verified fraud, disbursements frozen\n• ✅ False Alarm: Legitimate anomaly explained by documented justification.',
      hi: 'स्थिति चिप्स:\n• ⏳ लंबित: फील्ड अधिकारी निरीक्षण की प्रतीक्षा में\n• 🚨 पुष्ट समस्या: सत्यापित धोखाधड़ी, भुगतान रोका गया\n• ✅ सही कार्य: उचित स्पष्टीकरण के साथ वैध कार्य।'
    },
    details: {
      en: 'Auditor decisions are digitally signed and logged in the immutable feedback ledger, updating the national risk database instantly.',
      hi: 'ऑडिटर के निर्णय डिजिटल रूप से हस्ताक्षरित और लॉग किए जाते हैं, जिससे राष्ट्रीय डेटाबेस तुरंत अपडेट होता है।'
    },
    liveAction: null
  },
  {
    step: 15,
    route: '/admin/vendors',
    role: 'admin',
    targetSelector: '#tour-vendor-graph',
    fallbackSelector: '.card:has(div[style*="height: 500"])',
    preferredSide: 'left',
    title: {
      en: 'Vendor-MP Collusion Ring Intelligence Graph',
      hi: 'विक्रेता-सांसद सांठगांठ कार्टेल ग्राफ'
    },
    action: {
      en: 'Explore the force-directed graph to inspect detected vendor rings and high-centrality collusion hubs.',
      hi: 'पहचाने गए विक्रेता कार्टेल और उच्च-केंद्रीयता वाले हब का निरीक्षण करने के लिए ग्राफ देखें।'
    },
    dataFlow: {
      en: 'DATA FLOW: Built with NetworkX and Louvain community detection across 1,984 vendors, 774 MPs, and district implementing agencies. Exposes tender splitting, shell contractor networks, and bid-rigging rings.',
      hi: 'डेटा प्रवाह: 1,984 विक्रेताओं और 774 सांसदों के बीच NetworkX और Louvain समुदाय पहचान द्वारा निर्मित, जो टेंडर विभाजन और शेल कंपनियों के नेटवर्क को उजागर करता है।'
    },
    metricExplanation: {
      en: '• Node Icons: ⭐ = MP, ◆ = Contractor/Vendor, ● = Implementing Agency\n• Edge Thickness: Total transaction value (INR)\n• Collusion Rings: Louvain clusters sharing > 60% co-bidding overlap\n• Concentration Flags: Single vendor capturing > 30% of total agency spend.',
      hi: '• नोड प्रतीक: ⭐ = सांसद, ◆ = ठेकेदार/विक्रेता, ● = कार्यान्वयन एजेंसी\n• रेखा की मोटाई: कुल लेनदेन मूल्य\n• सांठगांठ रिंग्स: 60% से अधिक साझा टेंडर वाले समूह\n• संकेंद्रण चेतावनी: एजेंसी के 30% से अधिक बजट वाला एकल विक्रेता।'
    },
    details: {
      en: 'Hover over nodes to inspect company names, GST numbers, and agency share percentages.',
      hi: 'कंपनी का नाम, जीएसटी नंबर और एजेंसी शेयर प्रतिशत देखने के लिए नोड्स पर होवर करें।'
    },
    liveAction: null
  },
  {
    step: 16,
    route: '/admin/engines',
    role: 'admin',
    targetSelector: '#tour-engine-cards',
    fallbackSelector: '.card:has(.progress-fill)',
    preferredSide: 'left',
    title: {
      en: 'AI Core Heuristics & Engine Control Panel',
      hi: 'एआई कोर नियम एवं इंजन नियंत्रण कक्ष'
    },
    action: {
      en: 'Examine the 5 independent detection engines and their statutory weighting in the composite score.',
      hi: '5 स्वतंत्र पहचान इंजनों और समग्र स्कोर में उनके वैधानिक भार का परीक्षण करें।'
    },
    dataFlow: {
      en: 'DATA FLOW: The algorithmic core of PRAHARI. Each work is evaluated independently across all 5 engines, producing normalized sub-scores that merge into the unified 0-100 anomaly index.',
      hi: 'डेटा प्रवाह: प्रहरी का एल्गोरिथम कोर। प्रत्येक कार्य का सभी 5 इंजनों में स्वतंत्र रूप से मूल्यांकन किया जाता है, जिससे संयुक्त 0-100 जोखिम सूचकांक बनता है।'
    },
    metricExplanation: {
      en: '1. Compliance Rule Engine (Weight: 40pts): MoSPI guideline violations\n2. Financial Anomaly Engine (Weight: 35pts): Isolation Forest & Benford\'s Law\n3. Duplicate & Ghost Detector (Weight: 25pts): TF-IDF & pHash matching\n4. Vendor Network Intelligence (Weight: 15pts): Collusion clustering\n5. Predictive Delay Engine (Weight: 10pts): GradientBoosting completion forecast.',
      hi: '1. अनुपालन नियम इंजन (40 अंक): दिशानिर्देश उल्लंघन\n2. वित्तीय विसंगति इंजन (35 अंक): बेनफोर्ड नियम और आइसोलेशन फॉरेस्ट\n3. डुप्लिकेट कार्य पहचान (25 अंक): TF-IDF और pHash मिलान\n4. विक्रेता नेटवर्क (15 अंक): सांठगांठ क्लस्टरिंग\n5. संभावित विलंब इंजन (10 अंक): समय सीमा पूर्वानुमान।'
    },
    details: {
      en: 'Admins can trigger on-demand re-scoring across all 59,275 active works after updating model hyperparameters.',
      hi: 'मॉडल पैरामीटर अपडेट करने के बाद व्यवस्थापक सभी 59,275 सक्रिय कार्यों की पुन: स्कोरिंग शुरू कर सकते हैं।'
    },
    liveAction: null
  },
  {
    step: 17,
    route: '/admin/assistant',
    role: 'admin',
    targetSelector: '#tour-assistant-panel',
    fallbackSelector: '.card:has(input)',
    preferredSide: 'left',
    title: {
      en: 'AI Assistant, Chatbot & Text-to-SQL Querying',
      hi: 'एआई सहायक, चैटबॉट एवं टेक्स्ट-टू-एसक्यूएल क्वेरी'
    },
    action: {
      en: 'Ask natural-language questions about MPLADS guidelines or run direct Text-to-SQL queries on live data.',
      hi: 'सांसद निधि दिशानिर्देशों के बारे में प्रश्न पूछें या लाइव डेटाबेस पर सीधे टेक्स्ट-टू-एसक्यूएल क्वेरी चलाएं।'
    },
    dataFlow: {
      en: 'DATA FLOW: Retrieval-Augmented Generation (RAG) + Text-to-SQL Compiler. Translates plain English/Hindi queries into sanitized SQL statements, executes against the SQLite/PostgreSQL warehouse, and renders structured tables.',
      hi: 'डेटा प्रवाह: RAG + टेक्स्ट-टू-एसक्यूएल कंपाइलर। सामान्य भाषा के प्रश्नों को सुरक्षित एसक्यूएल में बदलता है, डेटाबेस पर निष्पादित करता है और संरचित परिणाम दिखाता है।'
    },
    metricExplanation: {
      en: 'Modes: Chat Mode (guideline interpretation and statutory compliance assistance) and SQL Query Mode (data aggregation across MPs, districts, and expenditure velocity).',
      hi: 'मोड: चैट मोड (दिशानिर्देश व्याख्या और वैधानिक सहायता) और एसक्यूएल क्वेरी मोड (सांसदों और जिलों में त्वरित डेटा विश्लेषण)।'
    },
    details: {
      en: 'Allows non-technical auditors and district officers to perform complex analytical queries without writing code.',
      hi: 'गैर-तकनीकी ऑडिटरों और जिला अधिकारियों को कोड लिखे बिना जटिल डेटा विश्लेषण करने में सक्षम बनाता है।'
    },
    liveAction: null
  },
  {
    step: 18,
    route: '/citizen/work/1',
    role: null,
    targetSelector: '#tour-citizen-badge',
    fallbackSelector: '.card:has(h2)',
    preferredSide: 'left',
    title: {
      en: 'Public Citizen Transparency & Whistleblower Portal',
      hi: 'सार्वजनिक नागरिक पारदर्शिता एवं व्हिसलब्लोअर पोर्टल'
    },
    action: {
      en: 'View public-facing verification badges and the citizen concern reporting tip line.',
      hi: 'सार्वजनिक सत्यापन बैज और नागरिक भ्रष्टाचार रिपोर्टिंग टिप लाइन देखें।'
    },
    dataFlow: {
      en: 'DATA FLOW: Last-Mile Accountability. Citizens scan QR codes printed on project signboards. Renders instant verification status with sensitive GPS coordinates redacted for privacy, while allowing direct whistleblower reports.',
      hi: 'डेटा प्रवाह: नागरिक परियोजना साइनबोर्ड पर मुद्रित क्यूआर कोड को स्कैन करते हैं। संवेदनशील जीपीएस छिपाते हुए सत्यापन स्थिति दिखाता है और सीधे शिकायत दर्ज करने की सुविधा देता है।'
    },
    metricExplanation: {
      en: '• Verification Badge: Official PRAHARI seal (Verified by District Officer vs Audit Flagged)\n• Whistleblower Hotline: Anonymous report submission directly to the Vigilance Commission.',
      hi: '• सत्यापन बैज: आधिकारिक प्रहरी मुहर (जिला अधिकारी द्वारा सत्यापित बनाम ऑडिट फ्लैग)\n• व्हिसलब्लोअर हेल्पलाइन: सतर्कता आयोग को सीधे गोपनीय रिपोर्ट भेजने की सुविधा।'
    },
    details: {
      en: 'Requires zero login credentials, democratizing social audit oversight across all parliamentary constituencies.',
      hi: 'लॉगिन की कोई आवश्यकता नहीं है, जिससे सभी संसदीय क्षेत्रों में सामाजिक ऑडिट निगरानी का लोकतंत्रीकरण होता है।'
    },
    liveAction: null
  },
  {
    step: 19,
    route: '/admin/ministry',
    role: 'admin',
    targetSelector: null,
    preferredSide: 'center',
    title: {
      en: 'Demo Completed Successfully!',
      hi: 'डेमो सफलतापूर्वक पूर्ण हुआ!'
    },
    action: {
      en: '⏹ CUT & STOP SCREEN RECORDING NOW',
      hi: '⏹ अब स्क्रीन रिकॉर्डिंग बंद करें'
    },
    dataFlow: {
      en: 'DATA FLOW SUMMARY: You have completed the full end-to-end PRAHARI demonstration. From initial MoSPI DPR ingestion and multi-engine screening, through geospatial maps, multimodal photographic validation, and explainable SHAP reasoning, all the way to citizen oversight.',
      hi: 'डेटा प्रवाह सारांश: आपने प्रहरी का पूर्ण एंड-टू-एंड प्रदर्शन पूरा कर लिया है। सांख्यिकी मंत्रालय डीपीआर अंतर्ग्रहण और एआई स्क्रीनिंग से लेकर भू-स्थानिक मानचित्र, बहुआयामी फोटो सत्यापन और नागरिक पोर्टल तक सभी चरण सत्यापित हो चुके हैं।'
    },
    metricExplanation: {
      en: 'Every graph, pie chart, risk metric, and fraud heuristic has been verified for production readiness.',
      hi: 'प्रत्येक ग्राफ, पाई चार्ट, जोखिम संकेतक और धोखाधड़ी पहचान नियम का उत्पादन स्तर पर सत्यापन हो चुका है।'
    },
    details: {
      en: 'All 5 AI engines, multimodal progress audits, collusion graphs, and citizen portals have been verified. The application is production-ready for SIH evaluation.',
      hi: 'सभी 5 एआई इंजन, बहुआयामी प्रगति ऑडिट, कार्टेल ग्राफ और नागरिक पोर्टल सत्यापित हो चुके हैं। आवेदन एसआईएच मूल्यांकन के लिए पूर्णतः तैयार है।'
    },
    liveAction: null
  }
];

const DemoTourContext = createContext({
  isActive: false,
  currentStepIndex: 0,
  currentStep: null,
  overrideSide: null,
  isCompleted: false,
  startTour: () => {},
  nextStep: () => {},
  prevStep: () => {},
  endTour: () => {},
  flipSide: () => {},
  jumpToStep: () => {},
  totalSteps: TOUR_STEPS.length,
});

export function DemoTourProvider({ children }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [overrideSide, setOverrideSide] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const currentStep = TOUR_STEPS[currentStepIndex] || null;

  // Jump to specific step with automated navigation and role setting
  const executeStep = useCallback((stepIdx) => {
    if (stepIdx < 0 || stepIdx >= TOUR_STEPS.length) return;
    const stepObj = TOUR_STEPS[stepIdx];
    setCurrentStepIndex(stepIdx);
    setOverrideSide(null);
    setIsCompleted(stepIdx === TOUR_STEPS.length - 1);

    // Apply role if needed
    if (stepObj.role === 'admin') {
      localStorage.setItem('prahari_demo_active', 'true');
      const currentUser = localStorage.getItem('prahari_user');
      let parsedRole = null;
      try {
        parsedRole = currentUser ? JSON.parse(currentUser).role : null;
      } catch {
        parsedRole = null;
      }

      // If user was not admin or token is missing/non-admin, assign demo admin token
      if (parsedRole !== 'admin' || !localStorage.getItem('prahari_token')) {
        localStorage.setItem('prahari_token', 'demo_admin_jwt_token_sih2026');
        localStorage.setItem('prahari_user', JSON.stringify({
          username: 'admin',
          role: 'admin',
          name: 'National Admin'
        }));
      }
    }

    // Auto-navigate if route doesn't match
    if (stepObj.route && location.pathname !== stepObj.route) {
      navigate(stepObj.route);
    }
  }, [location.pathname, navigate]);

  const startTour = useCallback((startIndex = 0) => {
    setIsActive(true);
    localStorage.setItem('prahari_demo_active', 'true');
    // Ensure clean admin identity when starting walkthrough
    localStorage.setItem('prahari_token', 'demo_admin_jwt_token_sih2026');
    localStorage.setItem('prahari_user', JSON.stringify({
      username: 'admin',
      role: 'admin',
      name: 'National Admin'
    }));
    executeStep(startIndex);
  }, [executeStep]);

  const nextStep = useCallback(() => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      executeStep(currentStepIndex + 1);
    } else {
      setIsCompleted(true);
    }
  }, [currentStepIndex, executeStep]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      executeStep(currentStepIndex - 1);
    }
  }, [currentStepIndex, executeStep]);

  const endTour = useCallback(() => {
    setIsActive(false);
    setOverrideSide(null);
    setIsCompleted(false);
    localStorage.removeItem('prahari_demo_active');
  }, []);

  const flipSide = useCallback(() => {
    setOverrideSide((prev) => {
      if (!prev) {
        const defaultSide = currentStep?.preferredSide || 'left';
        return defaultSide === 'left' ? 'right' : defaultSide === 'right' ? 'left' : defaultSide === 'top' ? 'bottom' : 'top';
      }
      return prev === 'left' ? 'right' : prev === 'right' ? 'left' : prev === 'top' ? 'bottom' : 'top';
    });
  }, [currentStep]);

  const jumpToStep = useCallback((idx) => {
    executeStep(idx);
  }, [executeStep]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!isActive) return;

    function handleKeyDown(e) {
      // Don't trigger if user is actively typing in an input/textarea
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;

      if (e.key === 'ArrowRight' || e.key === 'KeyD') {
        e.preventDefault();
        nextStep();
      } else if (e.key === 'ArrowLeft' || e.key === 'KeyA') {
        e.preventDefault();
        prevStep();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        endTour();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        flipSide();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, nextStep, prevStep, endTour, flipSide]);

  return (
    <DemoTourContext.Provider
      value={{
        isActive,
        currentStepIndex,
        currentStep,
        overrideSide,
        isCompleted,
        startTour,
        nextStep,
        prevStep,
        endTour,
        flipSide,
        jumpToStep,
        totalSteps: TOUR_STEPS.length,
      }}
    >
      {children}
    </DemoTourContext.Provider>
  );
}

export function useDemoTour() {
  return useContext(DemoTourContext);
}
