'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/lib/lucide-registry';
// Import additional icons needed for the inline menu
import { Sun, Moon, Globe, Accessibility, ChevronRight, Check, Eye, Zap, Menu, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { Button } from '@/components/ui/Button';
import { SettingsMenu } from './SettingsMenu';
import { ProBadge } from '@/components/shared/ProBadge';
import { MyToolsMenu } from './MyToolsMenu';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/components/providers/ThemeProvider';
import { i18n as i18nConfig } from '@/i18n-config';
import { usePathname, useRouter } from 'next/navigation';
import { useAccessibilityStore } from '@/lib/stores/accessibility-store';
import { cn } from '@/lib/utils';

export function Header() {
    const { t, i18n } = useTranslation('common');
    const { isPro } = useSubscription();
    const { theme, setTheme } = useTheme();
    const pathname = usePathname();
    const router = useRouter();
    const { highContrast, reduceMotion, toggleHighContrast, toggleReduceMotion } = useAccessibilityStore();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showLanguages, setShowLanguages] = useState(false);
    const [showAccessibility, setShowAccessibility] = useState(false);
    const [mounted, setMounted] = React.useState(false);
    const mobileMenuRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Languages list (copied from SettingsMenu for inline use)
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
        setMobileMenuOpen(false);
    };

    const navigation = [
        { name: t('nav.home'), href: '/' },
        { name: t('nav.tools'), href: '/tools' },
        { name: t('nav.blog'), href: '/blog' },
        { name: t('nav.about'), href: '/about' }, // Fixed hydration mismatch source
    ];

    return (
        <header className="sticky top-0 z-[70] w-full">
            <GlassCard className="mx-4 mt-4 px-4 py-3 lg:mx-8 lg:px-6" variant="highlight" animate={false}>
                <nav className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 hover-glow">
                        <img
                            src="/favicon.png"
                            alt="PDFToolskit Logo"
                            className="h-8 w-8 object-contain"
                        />
                        <span className="text-xl font-heading font-bold gradient-text">
                            PDFToolskit
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                <span suppressHydrationWarning>{item.name}</span>
                            </Link>
                        ))}
                    </div>

                    {/* Right Actions (Visible on all screens) */}
                    <div className="flex items-center gap-2 md:gap-4 md:ps-4 md:border-s md:border-slate-200 dark:md:border-white/10 ml-auto md:ml-0 mr-2 md:mr-0">
                        <MyToolsMenu />
                        {mounted && (
                            <div className="hidden md:block">
                                {isPro ? (
                                    <Link href="/pricing">
                                        <ProBadge variant="default" className="hover:scale-105 transition-transform cursor-pointer" />
                                    </Link>
                                ) : (
                                    <Link href="/pricing">
                                        <Button size="sm" variant="ghost" className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-xs gap-2">
                                            <Lucide.Zap className="w-3.5 h-3.5" />
                                            Go Pro
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        )}
                        {!mounted && (
                            <div className="hidden md:block w-20 h-8 animate-pulse bg-white/5 rounded-lg" />
                        )}
                        <div className="hidden md:flex items-center gap-1 md:gap-2">
                            <SettingsMenu />
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        type="button"
                        className="md:hidden p-3 rounded-lg glass glass-hover relative z-[80]"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? (
                            <X className="h-6 w-6 text-slate-900 dark:text-white" />
                        ) : (
                            <Menu className="h-6 w-6 text-slate-900 dark:text-white" />
                        )}
                    </button>
                </nav>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden mt-4 pt-4 border-t border-white/10 overflow-hidden max-h-[calc(100vh-80px)] overflow-y-auto"
                        ref={mobileMenuRef}
                    >
                        <div className="flex flex-col gap-4">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="block p-3 text-base font-medium text-slate-800 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/5 rounded-xl transition-all"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <span suppressHydrationWarning>{item.name}</span>
                                </Link>
                            ))}

                            <div className="px-3 py-2">
                                <div className="flex items-center justify-between bg-slate-100 dark:bg-white/5 rounded-xl p-3">
                                    {/* Theme Toggle */}
                                    <button
                                        onClick={() => {
                                            const newTheme = theme === 'dark' ? 'light' : 'dark';
                                            setTheme(newTheme);
                                        }}
                                        className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-colors flex-1"
                                    >
                                        {theme === 'dark' ? <Moon className="w-5 h-5 text-blue-400" /> : <Sun className="w-5 h-5 text-yellow-500" />}
                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Theme</span>
                                    </button>

                                    <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />

                                    {/* Language Selector */}
                                    <button
                                        onClick={() => {
                                            if (mobileMenuRef.current) mobileMenuRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                                            setShowLanguages(!showLanguages);
                                            setShowAccessibility(false); // Close access menu if open
                                        }}
                                        className={cn(
                                            "flex flex-col items-center gap-2 p-2 rounded-lg transition-colors flex-1 relative",
                                            showLanguages ? "bg-slate-200 dark:bg-white/10 text-blue-500" : "hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300"
                                        )}
                                    >
                                        <Globe className="w-5 h-5" />
                                        <span className="text-xs font-medium">Language</span>
                                    </button>

                                    <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />

                                    {/* Accessibility */}
                                    <button
                                        onClick={() => {
                                            if (mobileMenuRef.current) mobileMenuRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                                            setShowAccessibility(!showAccessibility);
                                            setShowLanguages(false); // Close lang menu if open
                                        }}
                                        className={cn(
                                            "flex flex-col items-center gap-2 p-2 rounded-lg transition-colors flex-1 relative",
                                            showAccessibility ? "bg-slate-200 dark:bg-white/10 text-blue-500" : "hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300"
                                        )}
                                    >
                                        <Accessibility className="w-5 h-5" />
                                        <span className="text-xs font-medium">Access</span>
                                    </button>
                                </div>

                                {/* Expanded Language List */}
                                <AnimatePresence>
                                    {showLanguages && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="mt-2 bg-slate-100 dark:bg-white/5 rounded-xl p-2 grid grid-cols-2 gap-1 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
                                                {LANGUAGES.map((lang) => (
                                                    <button
                                                        key={lang.code}
                                                        onClick={() => handleLanguageSelect(lang.code)}
                                                        className={cn(
                                                            "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-left",
                                                            i18n.language === lang.code
                                                                ? "bg-white dark:bg-white/10 text-blue-500 font-medium shadow-sm"
                                                                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5"
                                                        )}
                                                    >
                                                        <span className="flex-1 truncate">{lang.name}</span>
                                                        {i18n.language === lang.code && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Expanded Accessibility Options */}
                                <AnimatePresence>
                                    {showAccessibility && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="mt-2 bg-slate-100 dark:bg-white/5 rounded-xl p-2 space-y-1">
                                                <button
                                                    onClick={toggleHighContrast}
                                                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-200 dark:hover:bg-white/5 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Eye className="w-4 h-4 text-slate-500" />
                                                        <span className="text-sm text-slate-700 dark:text-slate-300">High Contrast</span>
                                                    </div>
                                                    <div className={cn(
                                                        "w-8 h-5 rounded-full relative transition-colors duration-300",
                                                        highContrast ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"
                                                    )}>
                                                        <div className={cn(
                                                            "absolute top-1 left-1 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-300",
                                                            highContrast ? "translate-x-3" : "translate-x-0"
                                                        )} />
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={toggleReduceMotion}
                                                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-200 dark:hover:bg-white/5 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Zap className="w-4 h-4 text-slate-500" />
                                                        <span className="text-sm text-slate-700 dark:text-slate-300">Reduce Motion</span>
                                                    </div>
                                                    <div className={cn(
                                                        "w-8 h-5 rounded-full relative transition-colors duration-300",
                                                        reduceMotion ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"
                                                    )}>
                                                        <div className={cn(
                                                            "absolute top-1 left-1 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-300",
                                                            reduceMotion ? "translate-x-3" : "translate-x-0"
                                                        )} />
                                                    </div>
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex items-center justify-between p-3 border-t border-slate-200 dark:border-white/10 bg-slate-900/5 dark:bg-white/5 rounded-xl">
                                <span className="text-sm text-slate-600 dark:text-slate-400">{isPro ? 'Your Plan' : 'Unlock Pro'}</span>
                                <div className="flex items-center gap-3">
                                    {mounted && (
                                        isPro ? (
                                            <Link href="/pricing" onClick={() => setMobileMenuOpen(false)}>
                                                <ProBadge variant="default" className="hover:scale-105 transition-transform cursor-pointer" />
                                            </Link>
                                        ) : (
                                            <Link href="/pricing" onClick={() => setMobileMenuOpen(false)}>
                                                <Button size="sm" variant="ghost" className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-xs gap-2">
                                                    <Lucide.Zap className="w-3.5 h-3.5" />
                                                    Go Pro
                                                </Button>
                                            </Link>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </GlassCard>
        </header >
    );
}
