import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import ALL languages to bundle them
import enCommon from '../public/locales/en/common.json';
import esCommon from '../public/locales/es/common.json';
import frCommon from '../public/locales/fr/common.json';
import deCommon from '../public/locales/de/common.json';
import itCommon from '../public/locales/it/common.json';
import ptCommon from '../public/locales/pt/common.json';
import jaCommon from '../public/locales/ja/common.json';
import ruCommon from '../public/locales/ru/common.json';
import koCommon from '../public/locales/ko/common.json';
import zhCNCommon from '../public/locales/zh-CN/common.json';
import zhTWCommon from '../public/locales/zh-TW/common.json';
import arCommon from '../public/locales/ar/common.json';
import bgCommon from '../public/locales/bg/common.json';
import caCommon from '../public/locales/ca/common.json';
import nlCommon from '../public/locales/nl/common.json';
import elCommon from '../public/locales/el/common.json';
import hiCommon from '../public/locales/hi/common.json';
import enSeo from '../public/locales/en/seo.json';
import esSeo from '../public/locales/es/seo.json';
import frSeo from '../public/locales/fr/seo.json';
import deSeo from '../public/locales/de/seo.json';
import itSeo from '../public/locales/it/seo.json';
import ptSeo from '../public/locales/pt/seo.json';
import jaSeo from '../public/locales/ja/seo.json';
import ruSeo from '../public/locales/ru/seo.json';
import koSeo from '../public/locales/ko/seo.json';
import zhCNSeo from '../public/locales/zh-CN/seo.json';
import zhTWSeo from '../public/locales/zh-TW/seo.json';
import arSeo from '../public/locales/ar/seo.json';
import bgSeo from '../public/locales/bg/seo.json';
import caSeo from '../public/locales/ca/seo.json';
import nlSeo from '../public/locales/nl/seo.json';
import idSeo from '../public/locales/id/seo.json';
import msSeo from '../public/locales/ms/seo.json';
import plSeo from '../public/locales/pl/seo.json';
import svSeo from '../public/locales/sv/seo.json';
import thSeo from '../public/locales/th/seo.json';
import trSeo from '../public/locales/tr/seo.json';
import viSeo from '../public/locales/vi/seo.json';
import ukSeo from '../public/locales/uk/seo.json';
import urSeo from '../public/locales/ur/seo.json';
import hiSeo from '../public/locales/hi/seo.json';
import elSeo from '../public/locales/el/seo.json';
import idCommon from '../public/locales/id/common.json';
import msCommon from '../public/locales/ms/common.json';
import plCommon from '../public/locales/pl/common.json';
import svCommon from '../public/locales/sv/common.json';
import thCommon from '../public/locales/th/common.json';
import trCommon from '../public/locales/tr/common.json';
import ukCommon from '../public/locales/uk/common.json';
import viCommon from '../public/locales/vi/common.json';
import urCommon from '../public/locales/ur/common.json';

const resources = {
    en: { common: enCommon, seo: enSeo },
    es: { common: esCommon, seo: esSeo },
    fr: { common: frCommon, seo: frSeo },
    de: { common: deCommon, seo: deSeo },
    it: { common: itCommon, seo: itSeo },
    pt: { common: ptCommon, seo: ptSeo },
    ja: { common: jaCommon, seo: jaSeo },
    ru: { common: ruCommon, seo: ruSeo },
    ko: { common: koCommon, seo: koSeo },
    'zh-CN': { common: zhCNCommon, seo: zhCNSeo },
    'zh-TW': { common: zhTWCommon, seo: zhTWSeo },
    ar: { common: arCommon, seo: arSeo },
    bg: { common: bgCommon, seo: bgSeo },
    ca: { common: caCommon, seo: caSeo },
    nl: { common: nlCommon, seo: nlSeo },
    el: { common: elCommon, seo: elSeo },
    hi: { common: hiCommon, seo: hiSeo },
    id: { common: idCommon, seo: idSeo },
    ms: { common: msCommon, seo: msSeo },
    pl: { common: plCommon, seo: plSeo },
    sv: { common: svCommon, seo: svSeo },
    th: { common: thCommon, seo: thSeo },
    tr: { common: trCommon, seo: trSeo },
    uk: { common: ukCommon, seo: ukSeo },
    vi: { common: viCommon, seo: viSeo },
    ur: { common: urCommon, seo: urSeo },
};

i18n
    .use(initReactI18next)
    .use(LanguageDetector)
    .init({
        fallbackLng: 'en',
        supportedLngs: Object.keys(resources),
        defaultNS: 'common',
        ns: ['common', 'seo'],
        fallbackNS: 'common',

        resources, // Fully bundled, zero latency, no 404s

        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
        react: {
            useSuspense: false
        }
    });

export default i18n;
