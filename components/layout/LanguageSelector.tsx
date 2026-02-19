'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { usePathname, useRouter } from 'next/navigation';
import { i18n as i18nConfig } from '@/i18n-config';

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

export function LanguageSelector() {
    const { i18n } = useTranslation('common');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const router = useRouter();

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (code: string) => {
        if (!pathname) return;

        const segments = pathname.split('/');
        // pathname starts with /, so segments[0] is ''
        // segments[1] is the locale if present

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (segments.length > 1 && i18nConfig.locales.includes(segments[1] as any)) {
            segments[1] = code;
        } else {
            // If locale is missing (should not happen with middleware), insert it
            segments.splice(1, 0, code);
        }

        const newPath = segments.join('/');

        // Update cookie to persist preference
        document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000; SameSite=Lax`;

        router.push(newPath);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/5 transition-colors"
                aria-label="Select Language"
            >
                <Globe className="w-4 h-4" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 top-full mt-2 w-56 max-h-[400px] overflow-y-auto rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl shadow-xl z-50 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10 scrollbar-track-transparent"
                    >
                        <div className="p-2 grid gap-1">
                            {LANGUAGES.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => handleSelect(lang.code)}
                                    className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-colors ${i18n.language === lang.code
                                        ? 'bg-primary/20 text-primary dark:text-white'
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-900/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                >
                                    <span>{lang.name}</span>
                                    {i18n.language === lang.code && (
                                        <Check className="w-4 h-4 text-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
