export const i18n = {
    defaultLocale: 'en',
    locales: [
        'en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'ja',
        'ko', 'zh', 'ar', 'hi', 'tr', 'id', 'vi', 'th', 'sv', 'da',
        'fi', 'no', 'cs', 'el', 'ro', 'hu'
    ],
} as const;

export const RTL_LOCALES = ['ar', 'he', 'fa', 'ur'];

export function isRtlLang(lang: string): boolean {
    return RTL_LOCALES.includes(lang);
}

export type Locale = (typeof i18n)['locales'][number];
