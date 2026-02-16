import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AccessibilityState {
    highContrast: boolean;
    reduceMotion: boolean;
    toggleHighContrast: () => void;
    toggleReduceMotion: () => void;
}

export const useAccessibilityStore = create<AccessibilityState>()(
    persist(
        (set) => ({
            highContrast: false,
            reduceMotion: false,
            toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),
            toggleReduceMotion: () => set((state) => ({ reduceMotion: !state.reduceMotion })),
        }),
        {
            name: 'accessibility-storage',
        }
    )
);
