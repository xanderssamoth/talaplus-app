import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/lang/en';
import fr from '@/lang/fr';
import ln from '@/lang/ln';

const resources = {
  fr: { translation: fr },
  en: { translation: en },
  ln: { translation: ln },
};

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources,
  lng: 'fr',
  fallbackLng: 'fr',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
