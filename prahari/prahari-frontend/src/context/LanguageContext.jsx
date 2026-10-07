import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Brand & Roles
    app_name: 'PRAHARI',
    app_subtitle: 'MPLADS AUDIT ENGINE',
    sih_tag: 'SIH 2026 · The_Semicolons',
    admin_panel: 'Admin Panel',
    user_panel: 'User Panel',
    logout: 'Logout',
    language: 'Language',
    switch_lang: 'हिन्दी',
    lang_code: 'EN',
    
    // Navigation
    nav_ministry: 'Ministry View',
    nav_state: 'State View',
    nav_district: 'District View',
    nav_upload: 'Upload Data',
    nav_review: 'Review Queue',
    nav_vendors: 'Vendor Network',
    nav_engines: 'Engine Control',
    nav_assistant: 'AI Assistant',
    nav_my_dashboard: 'My Dashboard',
    nav_my_works: 'My Works',
    nav_alerts: 'Alerts',

    // Dashboard & KPIs
    total_works: 'Total Works',
    fund_utilization: 'Fund Utilization',
    high_risk_works: 'High-Risk Works',
    duplicate_flags: 'Duplicate Flags',
    vendor_collusion: 'Vendor Collusion',
    completed_sub: 'completed',
    spent_sub: 'spent',
    pending_review: 'pending review',
    suspicious_rings: 'suspicious rings',
    progress_overview: 'Progress Overview',
    risk_distribution: 'Risk Distribution',
    monthly_trend: 'Monthly Expenditure Trend',
    top_high_risk: 'Top High-Risk Works',
    where_funds_used: 'Where Funds Are Used',
    heat_map_subtitle: 'Constituency-level pins · Green = low risk · Amber = medium · Red = high',
    works_requiring_attention: 'Works Requiring Attention',
    no_high_risk_works: 'No high-risk works detected in your scope!',
    
    // Table Headers
    th_work: 'Work',
    th_district: 'District',
    th_state: 'State',
    th_risk: 'Risk',
    th_status: 'Status',
    th_category: 'Category',
    th_amount: 'Amount',
    th_action: 'Action',
    
    // Status & Risk
    status_completed: 'Completed',
    status_recommended: 'Recommended',
    status_in_progress: 'In Progress',
    status_pending: 'Pending',
    risk_low: 'Low',
    risk_medium: 'Medium',
    risk_high: 'High',
    risk_score: 'Risk Score',
    anomaly_risk_score: 'Anomaly Risk Score',
    verified: 'Verified',
    flagged: 'Flagged',
    pending: 'Pending',
    confirmed_issue: 'Confirmed Issue',
    false_alarm: 'False Alarm',

    // Work Details & Audit
    back_to_works: 'Back to Works',
    work_id: 'Work ID',
    category: 'Category',
    agency: 'Agency',
    sanctioned_amount: 'Sanctioned Amount',
    expenditure_spent: 'Expenditure Spent',
    statutory_deadline: 'Statutory Deadline',
    one_year_post_sanction: '1 Year Post-Sanction',
    within_one_year: '✓ Within 1-Year Limit',
    overdue_by: '⚠️ Overdue by',
    days: 'days',
    citizen_rating: 'Citizen Rating',
    lakh: 'Lakh',
    crore: 'Cr',
    multimodal_engine_title: 'Multimodal Verification Engine (§9)',
    field_project_audit: 'Field Project Progress & Photographic Audit',
    completed_100: 'COMPLETED (100%)',
    in_progress_pct: 'IN PROGRESS',
    verified_physical_completion: 'Verified Physical Completion',
    completed_tag: 'Completed',
    baseline_earthwork: 'Baseline / Earthwork',
    foundation_grading: 'Foundation & Grading',
    superstructure_layering: 'Superstructure / Layering',
    final_handover: 'Final Handover & Signoff',
    ticked_off_title: 'Project Formally Ticked Off & Completed',
    ticked_off_desc: 'Multimodal validation confirmed 100% completion with geotag verification and structural audit.',
    closed_from_pending: 'Closed from Pending List',
    submit_progress_prompt: 'Submit geotagged photos or site evidence to advance milestone or conclude work.',
    submit_progress_btn: 'Submit Progress Update & Geotag Photo',
    close_upload_form: 'Close Upload Form',
    submit_new_evidence: 'Submit New Progress Evidence (Photos / Videos / Geotags)',
    select_target_milestone: 'Select Target Progress Milestone:',
    foundation_grading_opt: '50% (Foundation & Grading)',
    surfacing_pillars_opt: '75% (Surfacing & Pillars)',
    full_completion_opt: '100% (Full Project Completion)',
    site_photo_evidence: 'Site Photo / Video Evidence:',
    or_demo_one_click: '— OR DEMO WITH ONE CLICK: —',
    load_sample_photo: '📸 Load Sample Completed Road Photo',
    active_photo: 'Active Photo:',
    sample_completed_asset: 'Sample Completed Road Asset',
    resolution_exif_enabled: 'Resolution: High Definition · EXIF Geotag Enabled',
    hackathon_demo_simulation: '🎬 Hackathon Demo Geotag Simulation (Choose Scenario for Video):',
    genuine_site_geotag: '📍 Genuine Site Geotag (Within 35m of Centroid)',
    simulated_fraud_geotag: '🚨 Simulated Off-Site Fraud (14.8km away)',
    site_inspection_remarks: 'Site Inspection Remarks:',
    remarks_placeholder: 'Enter site engineer remarks...',
    validating_ai: 'Validating with Multimodal AI Engines...',
    submit_and_run_ai: 'Submit & Run Multimodal AI Validation (§9)',
    ai_auditor_active: 'AI Auditor Active',
    step_1_metadata: '📡 Step 1/4: Parsing EXIF metadata, camera device hash & GPS geotag...',
    step_2_phash: '🧠 Step 2/4: Computing Perceptual Hash (pHash) against 59,000+ national works...',
    step_3_opencv: '📐 Step 3/4: OpenCV Canny Edge & Structural Similarity (SSIM) physical change check...',
    step_4_deadline: '⚖️ Step 4/4: Evaluating MPLADS Guideline §7.4 1-Year statutory completion deadline...',
    validation_succeeded: 'Multimodal Validation Succeeded!',
    validation_flagged: 'Multimodal Validation Flagged Anomaly',
    authenticity: 'Authenticity',
    engine_inspection_audit: 'Engine Inspection Sub-Check Audit',
    geotag_location: '📍 Geotag Location:',
    phash_label: '👻 Perceptual Hash (pHash):',
    physical_structural_change: '📐 Physical Structural Change:',
    statutory_deadline_label: '⏰ Statutory Deadline:',
    verified_evidence_title: '📸 Verified Evidence Timeline & Site Photos',
    geotagged_records: 'Geotagged Records',
    milestone_0_baseline: 'Milestone 0% Baseline',
    excavation_grading: 'Excavation & Grading',
    paved_concrete_handover: 'Paved Concrete Handover',
    authenticity_verified: 'Authenticity Verified: 96.4% · EXIF Matched',
    why_flagged_title: 'Why This Work Was Flagged',
    ai_explanation: 'AI Explanation',
    detection_breakdown: 'Detection Confidence Breakdown',
    no_risk_factors: 'No risk factors detected — engines have not run yet or this work is clean.',
    five_engine_contributions: '5 AI Engine Anomaly Contributions',
    engine_compliance: '📋 Compliance',
    engine_financial: '💰 Financial',
    engine_duplicate: '👻 Duplicate',
    engine_vendor: '🕸️ Vendor',
    engine_delay: '⏰ Delay Risk',
    officer_verification_title: '🏷️ Officer Verification & Feedback (§3.1)',
    flag_as_genuine: 'Flag as Genuine Issue',
    mark_resolved: 'Mark Verified / Resolved',
    max_label: 'max',

    // Engine Control Panel
    engine_control_panel: 'Engine Control Panel',
    re_run_all_engines: 'Re-run All Engines',
    run_engines: 'Run Engines',
    running_engines: 'Running Engines...',
    engine_desc: 'Scores up to 3,000 works across all 5 engines. Takes 2-5 minutes on first run (model training included).',
    compliance_rule_engine: 'Compliance Rule Engine',
    financial_anomaly_engine: 'Financial Anomaly Engine',
    duplicate_ghost_detector: 'Duplicate & Ghost Detector',
    vendor_network_intelligence: 'Vendor Network Intelligence',
    predictive_delay_engine: 'Predictive Delay Engine',

    // Review Queue & Works Database
    review_queue_title: 'Review & Verification Queue',
    works_database: 'Works Database',
    search_works: 'Search works or constituency...',
    all_statuses: 'All Statuses',
    all_risks: 'All Risk Levels',
    min_risk: 'Min risk score:',
    works_shown: 'works shown',

    // Login
    login_title: 'AI-Powered MPLADS Audit Engine · SIH 2026',
    username_label: 'Username',
    password_label: 'Password',
    login_button: 'Login to PRAHARI',
    demo_accounts: 'Demo Accounts (click to fill)',
    citizen_link_hint: 'Citizen view: /citizen/work/<id> — no login required',
  },
  hi: {
    // Brand & Roles
    app_name: 'प्रहरी',
    app_subtitle: 'सांसद निधि (MPLADS) ऑडिट इंजन',
    sih_tag: 'एसआईएच 2026 · The_Semicolons',
    admin_panel: 'प्रशासक पैनल',
    user_panel: 'उपयोगकर्ता पैनल',
    logout: 'लॉग आउट',
    language: 'भाषा',
    switch_lang: 'English',
    lang_code: 'हि',

    // Navigation
    nav_ministry: 'मंत्रालय अवलोकन',
    nav_state: 'राज्य दृश्य',
    nav_district: 'जिला दृश्य',
    nav_upload: 'डेटा अपलोड',
    nav_review: 'समीक्षा कतार',
    nav_vendors: 'विक्रेता नेटवर्क',
    nav_engines: 'एआई इंजन नियंत्रण',
    nav_assistant: 'एआई सहायक',
    nav_my_dashboard: 'मेरा डैशबोर्ड',
    nav_my_works: 'मेरे कार्य',
    nav_alerts: 'चेतावनियां',

    // Dashboard & KPIs
    total_works: 'कुल स्वीकृत कार्य',
    fund_utilization: 'निधि उपयोग दर',
    high_risk_works: 'उच्च जोखिम कार्य',
    duplicate_flags: 'डुप्लिकेट अलर्ट',
    vendor_collusion: 'विक्रेता सांठगांठ',
    completed_sub: 'पूर्ण हुए',
    spent_sub: 'व्यय हुआ',
    pending_review: 'समीक्षा लंबित',
    suspicious_rings: 'संदिग्ध समूह',
    progress_overview: 'भौतिक प्रगति विवरण',
    risk_distribution: 'जोखिम स्कोर वितरण',
    monthly_trend: 'मासिक व्यय प्रवृत्ति',
    top_high_risk: 'शीर्ष उच्च जोखिम वाले कार्य',
    where_funds_used: 'निधि का क्षेत्रीय उपयोग',
    heat_map_subtitle: 'संसदीय क्षेत्र स्तर पिन · हरा = कम जोखिम · पीला = मध्यम · लाल = उच्च',
    works_requiring_attention: '⚠️ ध्यान देने योग्य कार्य',
    no_high_risk_works: 'आपके कार्यक्षेत्र में कोई उच्च जोखिम कार्य नहीं पाया गया!',

    // Table Headers
    th_work: 'कार्य विवरण',
    th_district: 'ज़िला',
    th_state: 'राज्य',
    th_risk: 'जोखिम स्कोर',
    th_status: 'वर्तमान स्थिति',
    th_category: 'श्रेणी',
    th_amount: 'स्वीकृत राशि',
    th_action: 'कार्रवाई',

    // Status & Risk
    status_completed: 'पूर्ण',
    status_recommended: 'अनुशंसित',
    status_in_progress: 'प्रगति पर',
    status_pending: 'लंबित',
    risk_low: 'निम्न',
    risk_medium: 'मध्यम',
    risk_high: 'उच्च',
    risk_score: 'जोखिम स्कोर',
    anomaly_risk_score: 'विसंगति जोखिम स्कोर',
    verified: 'सत्यापित',
    flagged: 'ध्वजंकित',
    pending: 'लंबित',
    confirmed_issue: 'पुष्ट समस्या',
    false_alarm: 'गलत चेतावनी',

    // Work Details & Audit
    back_to_works: 'कार्यों पर वापस जाएं',
    work_id: 'कार्य आईडी',
    category: 'श्रेणी',
    agency: 'कार्यान्वयन एजेंसी',
    sanctioned_amount: 'स्वीकृत राशि',
    expenditure_spent: 'व्यय राशि',
    statutory_deadline: 'वैधानिक समयसीमा',
    one_year_post_sanction: 'स्वीकृति के 1 वर्ष बाद',
    within_one_year: '✓ 1 वर्ष की समयसीमा के भीतर',
    overdue_by: '⚠️ विलंबित:',
    days: 'दिन',
    citizen_rating: 'नागरिक रेटिंग',
    lakh: 'लाख',
    crore: 'करोड़',
    multimodal_engine_title: 'बहुआयामी सत्यापन इंजन (§9)',
    field_project_audit: 'क्षेत्रीय परियोजना प्रगति एवं फोटोग्राफिक ऑडिट',
    completed_100: 'पूर्ण (100%)',
    in_progress_pct: 'प्रगति पर',
    verified_physical_completion: 'सत्यापित भौतिक समापन',
    completed_tag: 'पूर्ण',
    baseline_earthwork: 'आधारभूत / मिट्टी कार्य',
    foundation_grading: 'नींव एवं ग्रेडिंग',
    superstructure_layering: 'संरचना / परत निर्माण',
    final_handover: 'अंतिम हस्तांतरण एवं अनुमोदन',
    ticked_off_title: 'परियोजना आधिकारिक रूप से स्वीकृत एवं पूर्ण',
    ticked_off_desc: 'बहुआयामी सत्यापन ने जियोटैग और संरचनात्मक ऑडिट के साथ 100% पूर्णता की पुष्टि की। केंद्रीय eSAKSHI में अद्यतन किया गया।',
    closed_from_pending: 'लंबित सूची से हटाया गया',
    submit_progress_prompt: 'प्रगति चरण आगे बढ़ाने अथवा कार्य समाप्त करने हेतु जियोटैग फोटो या साक्ष्य जमा करें।',
    submit_progress_btn: 'प्रगति विवरण एवं जियोटैग फोटो जमा करें',
    close_upload_form: 'अपलोड फॉर्म बंद करें',
    submit_new_evidence: 'नया प्रगति साक्ष्य जमा करें (फोटो / वीडियो / जियोटैग)',
    select_target_milestone: 'लक्षित प्रगति चरण चुनें:',
    foundation_grading_opt: '50% (नींव एवं ग्रेडिंग)',
    surfacing_pillars_opt: '75% (सड़क निर्माण एवं खंभे)',
    full_completion_opt: '100% (पूर्ण परियोजना समापन)',
    site_photo_evidence: 'साइट फोटो / वीडियो साक्ष्य:',
    or_demo_one_click: '— अथवा एक क्लिक में डेमो देखें: —',
    load_sample_photo: '📸 नमूना पूर्ण सड़क फोटो लोड करें',
    active_photo: 'सक्रिय फोटो:',
    sample_completed_asset: 'नमूना पूर्ण सड़क संपत्ति',
    resolution_exif_enabled: 'रिज़ॉल्यूशन: उच्च गुणवत्ता · EXIF जियोटैग सक्षम',
    hackathon_demo_simulation: '🎬 हैकाथॉन डेमो जियोटैग सिमुलेशन (दृश्य चुनें):',
    genuine_site_geotag: '📍 वास्तविक साइट जियोटैग (केंद्र से 35मी के भीतर)',
    simulated_fraud_geotag: '🚨 सिम्युलेटेड ऑफ-साइट धोखाधड़ी (14.8 किमी दूर)',
    site_inspection_remarks: 'साइट निरीक्षण टिप्पणी:',
    remarks_placeholder: 'साइट इंजीनियर की टिप्पणी दर्ज करें...',
    validating_ai: 'बहुआयामी एआई इंजनों द्वारा सत्यापन जारी है...',
    submit_and_run_ai: 'जमा करें एवं बहुआयामी एआई सत्यापन चलाएं (§9)',
    ai_auditor_active: 'एआई परीक्षक सक्रिय...',
    step_1_metadata: '📡 चरण 1/4: EXIF मेटाडेटा, कैमरा डिवाइस हैश एवं GPS जियोटैग का पार्सिंग...',
    step_2_phash: '🧠 चरण 2/4: 59,000+ राष्ट्रीय कार्यों के विरुद्ध Perceptual Hash (pHash) गणना...',
    step_3_opencv: '📐 चरण 3/4: OpenCV Canny Edge एवं SSIM भौतिक परिवर्तन जांच...',
    step_4_deadline: '⚖️ चरण 4/4: सांसद निधि दिशानिर्देश §7.4 1-वर्षीय वैधानिक समयसीमा का मूल्यांकन...',
    validation_succeeded: 'बहुआयामी सत्यापन सफल!',
    validation_flagged: 'बहुआयामी सत्यापन द्वारा विसंगति चिह्नित',
    authenticity: 'प्रामाणिकता',
    engine_inspection_audit: 'इंजन उप-जांच ऑडिट',
    geotag_location: '📍 जियोटैग स्थान:',
    phash_label: '👻 परसेप्चुअल हैश (pHash):',
    physical_structural_change: '📐 भौतिक संरचनात्मक परिवर्तन:',
    statutory_deadline_label: '⏰ वैधानिक समयसीमा:',
    verified_evidence_title: '📸 सत्यापित साक्ष्य समयरेखा एवं साइट तस्वीरें',
    geotagged_records: 'जियोटैग किए गए रिकॉर्ड',
    milestone_0_baseline: 'मील का पत्थर 0% बेसलाइन',
    excavation_grading: 'खुदाई एवं ग्रेडिंग',
    paved_concrete_handover: 'कंक्रीट सड़क का अंतिम हस्तांतरण',
    authenticity_verified: 'प्रामाणिकता सत्यापित: 96.4% · EXIF सुमेलित',
    why_flagged_title: 'इस कार्य को संदिग्ध क्यों माना गया?',
    ai_explanation: 'एआई विश्लेषण एवं कारण',
    detection_breakdown: 'पता लगाने का विश्वास स्कोर विवरण',
    no_risk_factors: 'कोई जोखिम कारक नहीं पाया गया — इंजन अभी तक नहीं चले हैं या यह कार्य पूरी तरह स्वच्छ है।',
    five_engine_contributions: '5 एआई इंजन विसंगति योगदान',
    engine_compliance: '📋 अनुपालन',
    engine_financial: '💰 वित्तीय',
    engine_duplicate: '👻 डुप्लिकेट',
    engine_vendor: '🕸️ विक्रेता',
    engine_delay: '⏰ विलंब जोखिम',
    officer_verification_title: '🏷️ अधिकारी सत्यापन एवं प्रतिक्रिया (§3.1)',
    flag_as_genuine: 'वास्तविक समस्या के रूप में चिह्नित करें',
    mark_resolved: 'सत्यापित / समाधानित चिह्नित करें',
    max_label: 'अधिकतम',

    // Engine Control Panel
    engine_control_panel: 'एआई इंजन नियंत्रण कक्ष',
    re_run_all_engines: 'सभी एआई इंजन पुनः चलाएं',
    run_engines: 'इंजन चलाएं',
    running_engines: 'इंजन चल रहे हैं...',
    engine_desc: 'सभी 5 एआई इंजनों के माध्यम से कार्यों का मूल्यांकन। मॉडल प्रशिक्षण शामिल है।',
    compliance_rule_engine: 'दिशानिर्देश अनुपालन इंजन',
    financial_anomaly_engine: 'वित्तीय विसंगति इंजन',
    duplicate_ghost_detector: 'डुप्लिकेट एवं घोस्ट कार्य डिटेक्टर',
    vendor_network_intelligence: 'विक्रेता नेटवर्क विश्लेषण',
    predictive_delay_engine: 'भविष्य कहनेवाला विलंब इंजन',

    // Review Queue & Works Database
    review_queue_title: 'समीक्षा एवं सत्यापन कतार',
    works_database: 'स्वीकृत कार्यों का डेटाबेस',
    search_works: 'कार्य या संसदीय क्षेत्र खोजें...',
    all_statuses: 'सभी स्थितियां',
    all_risks: 'सभी जोखिम स्तर',
    min_risk: 'न्यूनतम जोखिम स्कोर:',
    works_shown: 'कार्य दिखाए गए',

    // Login
    login_title: 'एआई-संचालित सांसद निधि धोखाधड़ी निवारण प्रणाली · SIH 2026',
    username_label: 'उपयोगकर्ता नाम',
    password_label: 'पासवर्ड',
    login_button: 'प्रहरी में प्रवेश करें',
    demo_accounts: 'डेमो खाते (स्वतः भरने हेतु क्लिक करें)',
    citizen_link_hint: 'नागरिक दृश्य: /citizen/work/<id> — लॉगिन की आवश्यकता नहीं',
  }
};

export function translateStatus(status, lang) {
  if (lang !== 'hi') return status;
  const map = {
    'Completed': 'पूर्ण',
    'Recommended': 'अनुशंसित',
    'In Progress': 'प्रगति पर',
    'Pending': 'लंबित',
  };
  return map[status] || status;
}

export function translateCategory(cat, lang) {
  if (lang !== 'hi') return cat;
  const map = {
    'Normal/Others': 'सामान्य / अन्य',
    'Road': 'सड़क निर्माण',
    'Drinking Water': 'पेयजल',
    'Education': 'शिक्षा',
    'Health': 'स्वास्थ्य',
    'Sanitation': 'स्वच्छता',
    'Irrigation': 'सिंचाई',
    'Sports': 'खेलकूद',
  };
  return map[cat] || cat;
}

const LanguageContext = createContext({
  lang: 'en',
  toggleLang: () => {},
  setLang: () => {},
  t: (key, fallback) => fallback || key,
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('prahari_lang') || 'en';
  });

  const setLang = (newLang) => {
    localStorage.setItem('prahari_lang', newLang);
    setLangState(newLang);
  };

  const toggleLang = () => {
    const next = lang === 'en' ? 'hi' : 'en';
    setLang(next);
  };

  const t = (key, fallback) => {
    return translations[lang]?.[key] || translations['en']?.[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

