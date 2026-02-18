import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SubscriptionState {
    tier: 'free' | 'pro';
    setTier: (tier: 'free' | 'pro') => void;
    isPro: () => boolean;
    getLimits: () => {
        maxFileSize: number;
        aiLimit: number;
    };
}

export const useSubscriptionStore = create<SubscriptionState>()(
    persist(
        (set, get) => ({
            tier: 'pro',
            setTier: (tier) => set({ tier }),
            isPro: () => true,
            getLimits: () => {
                const isPro = get().tier === 'pro';
                return {
                    maxFileSize: isPro ? 1024 * 1024 * 1024 : 50 * 1024 * 1024,
                    aiLimit: isPro ? 1000 : 5,
                };
            },
        }),
        {
            name: 'pdftoolkit_subscription_storage',
        }
    )
);
