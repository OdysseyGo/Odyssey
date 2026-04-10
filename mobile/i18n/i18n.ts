import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './locales/en.json';
import tr from './locales/tr.json';

const supportedLanguages = ['en', 'tr'];
const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'en';
const defaultLanguage = supportedLanguages.includes(deviceLocale) ? deviceLocale : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    tr: { translation: tr },
  },
  lng: defaultLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  initImmediate: false,
});

export default i18n;
