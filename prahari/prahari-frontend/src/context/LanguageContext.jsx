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
    risk_low: 'Low',
    risk_medium: 'Medium',
    risk_high: 'High',
    verified: 'Verified',
    flagged: 'Flagged',
    pending: 'Pending',

    // Work Details & Audit
    work_audit_title: 'AI Multi-Modal Progress Audit',
    claimed_milestone: 'Claimed Progress Milestone',
    upload_photo: 'Upload On-Site Geotagged Photo',
    genuine_gps: 'Genuine Site Geotag (Within 35m)',
    fraud_gps: 'Simulated Off-Site Fraud (14.8km away)',
    run_verification: 'Run AI Progress Verification',
    auditor_active: 'AI Auditor Active',
    ticked_off_title: 'Project Formally Ticked Off & Completed',
    ticked_off_desc: 'Work verified at 100% milestone. Status updated to Completed in Central eSAKSHI Registry.',
    risk_factors: 'Why This Work Was Flagged',
    detection_breakdown: 'Detection Confidence Breakdown',
    
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
    risk_low: 'निम्न',
    risk_medium: 'मध्यम',
    risk_high: 'उच्च',
    verified: 'सत्यापित',
    flagged: 'ध्वजंकित',
    pending: 'लंबित',

    // Work Details & Audit
    work_audit_title: 'एआई बहुआयामी भौतिक प्रगति सत्यापन',
    claimed_milestone: 'दावा किया गया प्रगति चरण',
    upload_photo: 'स्थल की जियोटैग फोटो अपलोड करें',
    genuine_gps: 'वास्तविक कार्यस्थल जीपीएस (35मी के भीतर)',
    fraud_gps: 'सिम्युलेटेड फर्जी जीपीएस (14.8 किमी दूर)',
    run_verification: 'एआई प्रगति सत्यापन प्रारंभ करें',
    auditor_active: 'एआई परीक्षक सक्रिय...',
    ticked_off_title: 'परियोजना आधिकारिक रूप से स्वीकृत एवं पूर्ण',
    ticked_off_desc: 'कार्य 100% भौतिक सत्यापन के साथ पूर्ण हुआ। केंद्रीय eSAKSHI रजिस्ट्री में स्थिति अद्यतन की गई।',
    risk_factors: 'इस कार्य को संदिग्ध क्यों माना गया?',
    detection_breakdown: 'पता लगाने का विश्वास स्कोर विवरण',

    // Login
    login_title: 'एआई-संचालित सांसद निधि धोखाधड़ी निवारण प्रणाली · SIH 2026',
    username_label: 'उपयोगकर्ता नाम',
    password_label: 'पासवर्ड',
    login_button: 'प्रहरी में प्रवेश करें',
    demo_accounts: 'डेमो खाते (स्वतः भरने हेतु क्लिक करें)',
    citizen_link_hint: 'नागरिक दृश्य: /citizen/work/<id> — लॉगिन की आवश्यकता नहीं',
  }
};

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
