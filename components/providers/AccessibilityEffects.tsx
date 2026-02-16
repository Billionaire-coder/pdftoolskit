'use client';

import { useEffect } from 'react';
import { useAccessibilityStore } from '@/lib/stores/accessibility-store';

export function AccessibilityEffects() {
    const { highContrast, reduceMotion } = useAccessibilityStore();

    useEffect(() => {
        const id = 'accessibility-global-styles';
        let styleTag = document.getElementById(id) as HTMLStyleElement;

        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = id;
            document.head.appendChild(styleTag);
        }

        let css = '';
        if (highContrast) {
            css += `
                html {
                    filter: contrast(175%);
                }
                .high-contrast * {
                    /* Optional overrides */
                }
                .high-contrast img, .high-contrast video {
                    filter: grayscale(100%);
                }
            `;
            document.documentElement.classList.add('high-contrast');
        } else {
            document.documentElement.classList.remove('high-contrast');
        }

        if (reduceMotion) {
            css += `
                .reduce-motion * {
                    animation: none !important;
                    transition: none !important;
                    transform: none !important;
                }
            `;
            document.documentElement.classList.add('reduce-motion');
        } else {
            document.documentElement.classList.remove('reduce-motion');
        }

        styleTag.textContent = css;

    }, [highContrast, reduceMotion]);

    return null;
}
