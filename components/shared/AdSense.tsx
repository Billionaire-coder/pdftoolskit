'use client';

import React, { useEffect, useState } from 'react';
import { useSubscription } from '@/components/providers/SubscriptionProvider';

interface AdSenseProps {
    slot: string;
    format?: 'auto' | 'fluid' | 'rectangle';
    className?: string;
    style?: React.CSSProperties;
}

/**
 * AdSense Placeholder Component
 * In development, it shows a "Mock Ad" block.
 * In production, it loads the Carbon or AdSense script logic.
 */
export function AdSense({ slot, format = 'auto', className = '', style }: AdSenseProps) {
    const { isPro } = useSubscription();
    const [isDev, setIsDev] = useState(false);
    const [hasConsent, setHasConsent] = useState(false);

    useEffect(() => {
        setIsDev(process.env.NODE_ENV === 'development');
        // Check for consent (marketing/all)
        const consent = localStorage.getItem('cookie-consent');
        setHasConsent(consent === 'all');
    }, []);

    // AdSense disabled per user request (moved after hooks)
    return null;

    // Pro users don't see ads
    if (isPro) return null;

    // No consent = no ads (GDPR compliance)
    if (!hasConsent && !isDev) return null;

    return (
        <div
            className={`adsense-container my-6 overflow-hidden flex items-center justify-center rounded-xl p-4 border border-slate-700/50 bg-slate-800/20 text-slate-500 text-[10px] uppercase tracking-widest ${className}`}
            style={style}
        >
            {isDev ? (
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-slate-400">AD</div>
                    <p>AdSense Slot: {slot}</p>
                    <p className="text-[8px] font-bold text-slate-600">DEVELOPMENT MOCK</p>
                </div>
            ) : (
                <div className="w-full h-full flex items-center justify-center min-h-[100px]">
                    {/* Real AdSense Script would be injected here */}
                    <p>Advertisement</p>
                </div>
            )}
        </div>
    );
}
