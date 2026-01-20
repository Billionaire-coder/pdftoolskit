'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SubscriptionContextType {
    isPro: boolean;
    tier: 'free' | 'pro';
    setTier: (tier: 'free' | 'pro') => void;
    limits: {
        maxFileSize: number;
        aiLimit: number; // monthly or daily
    };
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    const [tier, setTier] = useState<'free' | 'pro'>('free');

    // Persist tier in localStorage (simple mock persist)
    useEffect(() => {
        const saved = localStorage.getItem('pdftoolkit_tier');
        if (saved === 'pro') setTier('pro');
    }, []);

    const handleSetTier = (newTier: 'free' | 'pro') => {
        setTier(newTier);
        localStorage.setItem('pdftoolkit_tier', newTier);
    };

    const value = {
        isPro: tier === 'pro',
        tier,
        setTier: handleSetTier,
        limits: {
            maxFileSize: tier === 'pro' ? 1024 * 1024 * 1024 : 50 * 1024 * 1024, // 1GB vs 50MB
            aiLimit: tier === 'pro' ? 1000 : 5,
        }
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
}

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        if (typeof window !== 'undefined') {
            console.warn('useSubscription called outside of SubscriptionProvider. Using fallback.');
        }
        // Fallback for SSR or if used outside provider accidentally
        return {
            isPro: false,
            tier: 'free' as const,
            setTier: () => { },
            limits: {
                maxFileSize: 50 * 1024 * 1024,
                aiLimit: 5
            }
        };
    }
    return context;
};
