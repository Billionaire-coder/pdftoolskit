'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Settings, Moon, Sun, Monitor, Check, ChevronRight, ArrowLeft, Eye, Zap, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { usePathname, useRouter } from 'next/navigation';
import { i18n as i18nConfig } from '@/i18n-config';
import { useAccessibilityStore } from '@/lib/stores/accessibility-store';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui/GlassCard';

// Using the same LANGUAGES list as before
const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'ja', name: '日本語' },
    { code: 'ru', name: 'Pусский' },
    { code: 'ko', name: '한국어' },
    { code: 'zh-CN', name: '中文 (简体)' },
    { code: 'zh-TW', name: '中文 (繁體)' },
    { code: 'ar', name: 'العربية' },
    { code: 'bg', name: 'Български' },
    { code: 'ca', name: 'Català' },
    { code: 'nl', name: 'Nederlands' },
    { code: 'el', name: 'Ελληνικά' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'id', name: 'Bahasa Indonesia' },
    { code: 'ms', name: 'Bahasa Melayu' },
    { code: 'pl', name: 'Polski' },
    { code: 'sv', name: 'Svenska' },
    { code: 'th', name: 'ภาษาไทย' },
    { code: 'tr', name: 'Türkçe' },
    { code: 'uk', name: 'Українська' },
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'ur', name: 'اردو' },
];

type MenuView = 'main' | 'language';

export function SettingsMenu() {
    const { t, i18n } = useTranslation('common');
    const { theme, setTheme } = useTheme();
    const { highContrast, reduceMotion, toggleHighContrast, toggleReduceMotion } = useAccessibilityStore();
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<MenuView>('main');
    const menuRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const router = useRouter();

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setView('main'); // Reset view on close
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLanguageSelect = (code: string) => {
        if (!pathname) return;
        const segments = pathname.split('/');
        if (segments.length > 1 && i18nConfig.locales.includes(segments[1] as any)) {
            segments[1] = code;
        } else {
            segments.splice(1, 0, code);
        }
        const newPath = segments.join('/');
        document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000; SameSite=Lax`;
        router.push(newPath);
        setIsOpen(false);
        setView('main');
    };

    const currentLangName = LANGUAGES.find(l => l.code === i18n.language)?.name || 'English';

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "p-2 rounded-lg transition-all duration-300",
                    "hover:bg-slate-900/5 dark:hover:bg-white/5",
                    isOpen ? "bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"
                )}
                aria-label="Settings"
            >
                <Settings className="w-5 h-5" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute end-0 top-full mt-2 w-72 z-50 ltr:origin-top-right rtl:origin-top-left"
                    >
                        <GlassCard className="overflow-hidden" variant="highlight">
                            <div className="relative">
                                {/* Main View */}
                                <motion.div
                                    animate={{
                                        x: view === 'main' ? 0 : '-100%',
                                        opacity: view === 'main' ? 1 : 0,
                                        pointerEvents: view === 'main' ? 'auto' : 'none'
                                    }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="w-full"
                                >
                                    <div className="p-2 space-y-1">
                                        {/* Theme Toggle */}
                                        <div className="p-2">
                                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-1">Theme</div>
                                            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-lg">
                                                <button
                                                    onClick={() => setTheme('light')}
                                                    className={cn(
                                                        "flex items-center justify-center p-1.5 rounded-md transition-all",
                                                        theme === 'light' ? "bg-white dark:bg-slate-700 shadow-sm text-yellow-500" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                                    )}
                                                >
                                                    <Sun className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setTheme('dark')}
                                                    className={cn(
                                                        "flex items-center justify-center p-1.5 rounded-md transition-all",
                                                        theme === 'dark' ? "bg-white dark:bg-slate-700 shadow-sm text-blue-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                                    )}
                                                >
                                                    <Moon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setTheme('system')}
                                                    className={cn(
                                                        "flex items-center justify-center p-1.5 rounded-md transition-all",
                                                        theme === 'system' ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                                    )}
                                                >
                                                    <Monitor className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="h-px bg-slate-200 dark:bg-white/10 mx-2 my-1" />

                                        {/* Language Trigger */}
                                        <button
                                            onClick={() => setView('language')}
                                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-900/5 dark:hover:bg-white/5 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500">
                                                    <Globe className="w-4 h-4" />
                                                </div>
                                                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Language</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-500">{currentLangName}</span>
                                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform rtl:rotate-180" />
                                            </div>
                                        </button>

                                        <div className="h-px bg-slate-200 dark:bg-white/10 mx-2 my-1" />

                                        {/* Accessibility */}
                                        <div className="p-2">
                                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-1">Accessibility</div>
                                            <div className="space-y-1">
                                                <button
                                                    onClick={toggleHighContrast}
                                                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-900/5 dark:hover:bg-white/5 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Eye className="w-4 h-4 text-slate-500" />
                                                        <span className="text-sm text-slate-700 dark:text-slate-300">High Contrast</span>
                                                    </div>
                                                    <div className={cn(
                                                        "w-8 h-5 rounded-full relative transition-colors duration-300",
                                                        highContrast ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                                                    )}>
                                                        <div className={cn(
                                                            "absolute top-1 left-1 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-300",
                                                            highContrast ? "translate-x-3" : "translate-x-0"
                                                        )} />
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={toggleReduceMotion}
                                                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-900/5 dark:hover:bg-white/5 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Zap className="w-4 h-4 text-slate-500" />
                                                        <span className="text-sm text-slate-700 dark:text-slate-300">Reduce Motion</span>
                                                    </div>
                                                    <div className={cn(
                                                        "w-8 h-5 rounded-full relative transition-colors duration-300",
                                                        reduceMotion ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                                                    )}>
                                                        <div className={cn(
                                                            "absolute top-1 left-1 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-300",
                                                            reduceMotion ? "translate-x-3" : "translate-x-0"
                                                        )} />
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Language View */}
                                <motion.div
                                    initial={{ x: '100%', opacity: 0 }}
                                    animate={{
                                        x: view === 'language' ? 0 : '100%',
                                        opacity: view === 'language' ? 1 : 0,
                                        pointerEvents: view === 'language' ? 'auto' : 'none'
                                    }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="absolute inset-0 w-full h-full bg-white dark:bg-[#0f172a]"
                                >
                                    <div className="flex flex-col h-full">
                                        <div className="flex items-center gap-2 p-3 border-b border-slate-200 dark:border-white/10">
                                            <button
                                                onClick={() => setView('main')}
                                                className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/10"
                                            >
                                                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300 rtl:rotate-180" />
                                            </button>
                                            <span className="font-semibold text-sm text-slate-900 dark:text-white">Select Language</span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
                                            {LANGUAGES.map((lang) => (
                                                <button
                                                    key={lang.code}
                                                    onClick={() => handleLanguageSelect(lang.code)}
                                                    className={cn(
                                                        "flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-colors mb-1",
                                                        i18n.language === lang.code
                                                            ? "bg-primary/10 text-primary font-medium"
                                                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                                                    )}
                                                >
                                                    <span>{lang.name}</span>
                                                    {i18n.language === lang.code && (
                                                        <Check className="w-4 h-4 text-primary" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
