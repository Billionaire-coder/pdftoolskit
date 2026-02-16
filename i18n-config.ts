export const i18n = {
    defaultLocale: 'en',
    locales: [
        'en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ru', 'ko', 'zh-CN', 'zh-TW',
        'ar', 'bg', 'ca', 'nl', 'el', 'hi', 'id', 'ms', 'pl', 'sv', 'th', 'tr',
        'uk', 'vi', 'ur'
    ],
} as const;

export const RTL_LOCALES = ['ar', 'he', 'fa', 'ur'];

export function isRtlLang(lang: string): boolean {
    return RTL_LOCALES.includes(lang);
}

export type Locale = (typeof i18n)['locales'][number];
