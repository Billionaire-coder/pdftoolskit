import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';
import commonEn from '../public/locales/en/common.json';
import seoEn from '../public/locales/en/seo.json';

const supportedLngs = [
    'en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ru', 'ko', 'zh-CN', 'zh-TW',
    'ar', 'bg', 'ca', 'nl', 'el', 'hi', 'id', 'ms', 'pl', 'sv', 'th', 'tr',
    'uk', 'vi', 'ur'
];

const i18nInstance = i18n.use(initReactI18next);

if (typeof window !== 'undefined') {
    i18nInstance
        .use(HttpApi)
        .use(LanguageDetector);
}

i18nInstance.init({
    fallbackLng: 'en',
    supportedLngs,
    defaultNS: 'common',
    ns: ['common', 'seo'],
    fallbackNS: 'common',

    resources: {
        en: {
            common: commonEn,
            seo: seoEn,
        },
    },

    backend: {
        loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    interpolation: {
        escapeValue: false,
    },
    detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
    },
    react: {
        useSuspense: false,
    }
});

export default i18n;

