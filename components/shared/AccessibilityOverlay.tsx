'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Eye, Zap, type LucideIcon, X, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface AccessibilityOption {
    id: string;
    label: string;
    icon: LucideIcon;
    isActive: boolean;
    toggle: () => void;
}

export function AccessibilityOverlay() {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [highContrast, setHighContrast] = useState(false);
    const [reduceMotion, setReduceMotion] = useState(false);

    // Apply High Contrast
    useEffect(() => {
        if (highContrast) {
            document.documentElement.classList.add('high-contrast');
            document.documentElement.style.setProperty('--contrast-text', '#000000');
            document.documentElement.style.setProperty('--contrast-bg', '#ffffff');
        } else {
            document.documentElement.classList.remove('high-contrast');
            document.documentElement.style.removeProperty('--contrast-text');
            document.documentElement.style.removeProperty('--contrast-bg');
        }
    }, [highContrast]);

    // Apply Reduce Motion
    useEffect(() => {
        if (reduceMotion) {
            document.documentElement.classList.add('reduce-motion');
        } else {
            document.documentElement.classList.remove('reduce-motion');
        }
    }, [reduceMotion]);

    // Keyboard Shortcut (Alt+A)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.code === 'KeyA') {
                setIsOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const options: AccessibilityOption[] = [
        {
            id: 'high-contrast',
            label: t('a11y.highContrast', 'High Contrast'),
            icon: Eye,
            isActive: highContrast,
            toggle: () => setHighContrast(!highContrast),
        },
        {
            id: 'reduce-motion',
            label: t('a11y.reduceMotion', 'Reduce Motion'),
            icon: Zap,
            isActive: reduceMotion,
            toggle: () => setReduceMotion(!reduceMotion),
        },
    ];

    return (
        <>
            {/* Trigger Button */}
            <div className="fixed bottom-4 left-4 z-50 pointer-events-none">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsOpen(true)}
                    className={cn(
                        "rounded-full w-10 h-10 p-0 shadow-2xl border border-white/20 bg-slate-900/80 backdrop-blur-md pointer-events-auto",
                        isOpen && "hidden"
                    )}
                    aria-label={t('a11y.openMenu', 'Accessibility Menu')}
                    icon={<Settings className="w-5 h-5 text-slate-200" />}
                />
            </div>

            {/* Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-4 left-4 z-[100] max-w-sm w-full"
                    >
                        <GlassCard className="p-4 border-slate-700 bg-slate-900/95 shadow-2xl relative overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                                <div className="flex items-center gap-2">
                                    <Keyboard className="w-4 h-4 text-emerald-400" />
                                    <h3 className="font-bold text-white text-sm">
                                        {t('a11y.title', 'Accessibility')}
                                    </h3>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsOpen(false)}
                                    className="w-8 h-8 p-0 rounded-full hover:bg-white/10"
                                    icon={<X className="w-4 h-4 text-slate-400" />}
                                />
                            </div>

                            {/* Options */}
                            <div className="space-y-2">
                                {options.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={opt.toggle}
                                        className={cn(
                                            "w-full flex items-center justify-between p-3 rounded-lg transition-all text-sm font-medium border",
                                            opt.isActive
                                                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                                                : "bg-slate-800/50 border-white/5 text-slate-300 hover:bg-slate-800"
                                        )}
                                        aria-pressed={opt.isActive}
                                    >
                                        <div className="flex items-center gap-3">
                                            <opt.icon className={cn("w-4 h-4", opt.isActive && "text-emerald-400")} />
                                            <span>{opt.label}</span>
                                        </div>
                                        <div className={cn(
                                            "w-3 h-3 rounded-full border",
                                            opt.isActive ? "bg-emerald-400 border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "border-slate-500"
                                        )} />
                                    </button>
                                ))}
                            </div>

                            {/* Tool Specific Tips */}
                            <div className="mt-6 space-y-2">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                                    {t('a11y.tipsTitle', 'Screen Reader Tips')}
                                </h4>
                                <div className="bg-slate-800/30 rounded-lg p-3 border border-white/5 space-y-2">
                                    <div className="flex items-start gap-2 text-xs text-slate-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
                                        <p>Use <kbd className="bg-slate-700 px-1 rounded">Tab</kbd> to cycle through interactive PDF areas.</p>
                                    </div>
                                    <div className="flex items-start gap-2 text-xs text-slate-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
                                        <p>Announcements will play when files are uploaded or moved.</p>
                                    </div>
                                    <div className="flex items-start gap-2 text-xs text-slate-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
                                        <p>Press <kbd className="bg-slate-700 px-1 rounded">Alt + A</kbd> any time to toggle this menu.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Hint */}
                            <div className="mt-4 pt-2 border-t border-white/10 text-[10px] text-slate-500 text-center">
                                {t('a11y.hotkey', 'Shortcut: Alt + A')}
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Accessibility Styles injected via useEffect to avoid ESLint no-danger rule */}
            <AccessibilityStyles highContrast={highContrast} reduceMotion={reduceMotion} />
        </>
    );
}

function AccessibilityStyles({ highContrast, reduceMotion }: { highContrast: boolean; reduceMotion: boolean }) {
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
                    /* Only force colors where needed, avoided universal background-black to keep transparency */
                }
                .high-contrast img, .high-contrast video {
                    filter: grayscale(100%);
                }
            `;
        }
        if (reduceMotion) {
            css += `
                .reduce-motion * {
                    animation: none !important;
                    transition: none !important;
                    transform: none !important;
                }
            `;
        }

        styleTag.textContent = css;

        return () => {
            // Keep the tag but clear it on unmount if needed,
            // or just let it be managed by the parent component's state.
        };
    }, [highContrast, reduceMotion]);

    return null;
}
