import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation resources
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import arTranslations from './locales/ar.json';
import frTranslations from './locales/fr.json';
import deTranslations from './locales/de.json';
import zhCNTranslations from './locales/zh-CN.json';
import jaTranslations from './locales/ja.json';
import ptTranslations from './locales/pt.json';

const resources = {
  en: {
    translation: enTranslations,
  },
  es: {
    translation: esTranslations,
  },
  ar: {
    translation: arTranslations,
  },
  fr: {
    translation: frTranslations,
  },
  de: {
    translation: deTranslations,
  },
  'zh-CN': {
    translation: zhCNTranslations,
  },
  ja: {
    translation: jaTranslations,
  },
  pt: {
    translation: ptTranslations,
  },
};

// RTL languages list
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

// Helper function to check if language is RTL
const isRTL = (language) => {
  const langCode = language.split('-')[0]; // Handle language codes like 'ar-SA'
  return RTL_LANGUAGES.includes(langCode);
};

// Helper function to set document direction
const setDocumentDirection = (language) => {
  const direction = isRTL(language) ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('dir', direction);
  document.documentElement.setAttribute('lang', language);
};

i18n
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next
  .use(initReactI18next)
  // init i18next
  .init({
    debug: process.env.NODE_ENV === 'development',
    
    fallbackLng: 'en',
    
    resources,
    
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    
    detection: {
      // options for language detection
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    
    react: {
      // options for react-i18next
      useSuspense: false,
    },
  });

// Set initial direction based on detected language
setDocumentDirection(i18n.language || 'en');

// Listen for language changes and update document direction
i18n.on('languageChanged', (language) => {
  setDocumentDirection(language);
});

export default i18n;
export { isRTL, setDocumentDirection, RTL_LANGUAGES };
