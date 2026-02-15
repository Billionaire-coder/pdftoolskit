'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lucide } from '@/lib/lucide-registry';
import { GlassCard } from '@/components/ui/GlassCard';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { Button } from '@/components/ui/Button';
import { LanguageSelector } from './LanguageSelector';
import { ThemeToggle } from './ThemeToggle';
import { ProBadge } from '@/components/shared/ProBadge';
import { MyToolsMenu } from './MyToolsMenu';

import { useTranslation } from 'react-i18next';

export function Header() {
    const { t } = useTranslation('common');
    const { isPro } = useSubscription();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

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
                        <MyToolsMenu />
                        <div className="flex items-center gap-4 ps-4 border-s border-slate-200 dark:border-white/10">
                            {mounted && (
                                isPro ? (
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
                                )
                            )}
                            {!mounted && (
                                <div className="w-20 h-8 animate-pulse bg-white/5 rounded-lg" />
                            )}
                            <div className="flex items-center gap-2">
                                <LanguageSelector />
                                <ThemeToggle />
                            </div>
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        type="button"
                        className="md:hidden p-3 rounded-lg glass glass-hover relative z-[80]"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? (
                            <Lucide.X className="h-6 w-6 text-slate-900 dark:text-white" />
                        ) : (
                            <Lucide.Menu className="h-6 w-6 text-slate-900 dark:text-white" />
                        )}
                    </button>
                </nav>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden mt-4 pt-4 border-t border-white/10 overflow-hidden"
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
                            <div className="flex items-center justify-between p-3 border-t border-slate-200 dark:border-white/10 bg-slate-900/5 dark:bg-white/5 rounded-xl">
                                <span className="text-sm text-slate-600 dark:text-slate-400">{t('nav.settings')}</span>
                                <div className="flex items-center gap-3">
                                    <LanguageSelector />
                                    <ThemeToggle />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </GlassCard>
        </header>
    );
}
