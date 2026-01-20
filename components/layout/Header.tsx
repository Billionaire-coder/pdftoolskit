'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Menu, X, FileText, Zap, Crown } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { Button } from '@/components/ui/Button';
import { LanguageSelector } from './LanguageSelector';
import { ThemeToggle } from './ThemeToggle';

import { useTranslation } from 'react-i18next';

export function Header() {
    const { t } = useTranslation('common');
    const { isPro } = useSubscription();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navigation = [
        { name: t('nav.home'), href: '/' },
        { name: t('nav.tools'), href: '/tools' },
        { name: t('nav.blog'), href: '/blog' },
        { name: t('nav.about'), href: '/about' }, // Fixed hydration mismatch source
    ];

    return (
        <header className="sticky top-0 z-50 w-full">
            <GlassCard className="mx-4 mt-4 px-4 py-3 lg:mx-8 lg:px-6" variant="highlight" animate={false}>
                <nav className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 hover-glow">
                        <div className="rounded-lg bg-gradient-primary p-2">
                            <FileText className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-heading font-bold gradient-text">
                            PDFToolkit
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                            >
                                <span suppressHydrationWarning>{item.name}</span>
                            </Link>
                        ))}
                        <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                            {isPro ? (
                                <Link href="/pricing" className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold hover:bg-amber-500/20 transition-colors">
                                    <Crown className="w-3.5 h-3.5" />
                                    PRO
                                </Link>
                            ) : (
                                <Link href="/pricing">
                                    <Button size="sm" variant="ghost" className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 text-xs gap-2">
                                        <Zap className="w-3.5 h-3.5" />
                                        Go Pro
                                    </Button>
                                </Link>
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
                        className="md:hidden p-2 rounded-lg glass glass-hover"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? (
                            <X className="h-6 w-6" />
                        ) : (
                            <Menu className="h-6 w-6" />
                        )}
                    </button>
                </nav>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden mt-4 pt-4 border-t border-white/10"
                    >
                        <div className="flex flex-col gap-4">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <span suppressHydrationWarning>{item.name}</span>
                                </Link>
                            ))}
                            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                <span className="text-sm text-slate-400">{t('nav.settings')}</span>
                                <div className="flex items-center gap-2">
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
