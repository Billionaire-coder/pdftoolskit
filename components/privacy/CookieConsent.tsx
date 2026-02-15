'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button'; // Assuming you have a Button component

export const CookieConsent = () => {
    const { t } = useTranslation();
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            setShowBanner(true);
        }
    }, []);

    const handleAcceptAll = () => {
        localStorage.setItem('cookie-consent', 'all');
        setShowBanner(false);
        // Trigger a reload or event to enabling tracking scripts
        window.location.reload();
    };

    const handleNecessaryOnly = () => {
        localStorage.setItem('cookie-consent', 'necessary');
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-4 md:p-6 z-50 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm text-slate-300 space-y-2">
                    <p className="font-semibold text-white">
                        {t('cookies.title', 'We value your privacy')}
                    </p>
                    <p>
                        {t('cookies.description', 'We use cookies to enhance your experience and analyze our traffic. AI models are cached locally on your device.')}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <Button variant="outline" size="sm" onClick={handleNecessaryOnly}>
                        {t('cookies.necessary', 'Necessary Only')}
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleAcceptAll}>
                        {t('cookies.accept', 'Accept All')}
                    </Button>
                </div>
            </div>
        </div>
    );
};
