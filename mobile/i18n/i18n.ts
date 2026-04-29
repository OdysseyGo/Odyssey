import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import tr from './locales/tr.json';
import es from './locales/es.json';
import { FALLBACK_LANGUAGE, getDeviceLanguage } from './languageConfig';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    tr: { translation: tr },
    es: { translation: es },
  },
  lng: getDeviceLanguage(),
  fallbackLng: FALLBACK_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
  initImmediate: false,
});

export default i18n;
