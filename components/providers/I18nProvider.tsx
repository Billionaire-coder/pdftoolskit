'use client';

import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { ReactNode, useEffect } from 'react';

export function I18nProvider({ children, locale }: { children: ReactNode; locale: string }) {
    useEffect(() => {
        if (locale && i18n.language !== locale) {
            console.log(`I18nProvider: Switching language to ${locale}`);
            i18n.changeLanguage(locale);
        }
    }, [locale]);

    return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
