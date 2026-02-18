'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSubscriptionStore } from '@/lib/stores/subscription-store';

interface SubscriptionContextType {
    isPro: boolean;
    tier: 'free' | 'pro';
    setTier: (tier: 'free' | 'pro') => void;
    limits: {
        maxFileSize: number;
        aiLimit: number;
    };
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    const { tier, setTier, isPro, getLimits } = useSubscriptionStore();
    const { data: session } = useSession();

    // Sync with server state (Bypassed for Local Testing)
    useEffect(() => {
        if (tier !== 'pro') {
            setTier('pro');
        }
    }, [tier, setTier]);

    const value = {
        isPro: isPro(),
        tier,
        setTier,
        limits: getLimits()
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
}

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);

    // If context is unavailable (i.e. used outside of provider), we can still use the store directly!
    // This is the beauty of Zustant. We fallback to the store hook if needed.
    const store = useSubscriptionStore();

    if (!context) {
        return {
            isPro: store.isPro(),
            tier: store.tier,
            setTier: store.setTier,
            limits: store.getLimits()
        };
    }

    return context;
};

