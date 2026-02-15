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

    // Sync with server state to prevent "Console Hack"
    useEffect(() => {
        if (session?.user) {
            // In a real app, isPro would be a boolean on the user object.
            // Here we use the image field as a mock, consistent with checking logic.
            const serverTier = (session.user.image === 'pro' || (session.user as any).isPro) ? 'pro' : 'free';
            if (tier !== serverTier) {
                setTier(serverTier);
            }
        } else {
            // Reset to free if logged out
            if (tier !== 'free') setTier('free');
        }
    }, [session, tier, setTier]);

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

