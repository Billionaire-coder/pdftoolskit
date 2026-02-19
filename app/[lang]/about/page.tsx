'use client';

import React from 'react';
// import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Lock, Globe, FileText, Cpu, Star } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Trans } from 'react-i18next';
import { ToolHeader } from '@/components/shared/ToolHeader';

export default function AboutPage() {
    const { t } = useTranslation('common');
    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-6xl">
            {/* Hero Section */}
            <ToolHeader
                title={t('about.hero.title')}
                description={t('about.hero.subtitle')}
                icon={FileText}
                color="from-primary to-secondary"
            />

            {/* Core Philosophy */}
            <div className="grid md:grid-cols-2 gap-8 mb-24">
                <GlassCard className="p-8 lg:p-12 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 scale-0 group-hover:scale-100 transition-transform duration-700" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 dark:text-blue-400">
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('about.philosophy.zeroServer.title')}</h2>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                            <Trans i18nKey="about.philosophy.zeroServer.content" components={{ strong: <strong /> }} />
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                            {t('about.philosophy.zeroServer.subContent')}
                        </p>
                    </div>
                </GlassCard>

                <GlassCard className="p-8 lg:p-12 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -mr-32 -mt-32 scale-0 group-hover:scale-100 transition-transform duration-700" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500 dark:text-purple-400">
                                <Zap className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('about.philosophy.speed.title')}</h2>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                            {t('about.philosophy.speed.content')}
                        </p>
                        <ul className="space-y-3">
                            {(t('about.philosophy.speed.features', { returnObjects: true }) as string[]).map((item) => (
                                <li key={item} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                    <Star className="w-3 h-3 text-secondary" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </GlassCard>
            </div>

            {/* AI Deep Dive */}
            <div className="mb-24">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{t('about.ai.title')}</h2>
                    <p className="text-slate-600 dark:text-slate-400">{t('about.ai.subtitle')}</p>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    <GlassCard className="p-6 text-center">
                        <Cpu className="w-10 h-10 text-blue-500 dark:text-blue-400 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('about.ai.local.title')}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{t('about.ai.local.desc')}</p>
                    </GlassCard>
                    <GlassCard className="p-6 text-center">
                        <Lock className="w-10 h-10 text-purple-500 dark:text-purple-400 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('about.ai.training.title')}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{t('about.ai.training.desc')}</p>
                    </GlassCard>
                    <GlassCard className="p-6 text-center">
                        <Globe className="w-10 h-10 text-emerald-500 dark:text-emerald-400 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('about.ai.private.title')}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{t('about.ai.private.desc')}</p>
                    </GlassCard>
                </div>
            </div>

            {/* CTA Section */}
            <GlassCard className="p-8 lg:p-12 text-center bg-gradient-to-br from-slate-200/50 to-slate-300/50 dark:from-slate-800/50 dark:to-slate-900/50">
                <h2 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">{t('about.cta.title')}</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-10 max-w-xl mx-auto">
                    {t('about.cta.subtitle')}
                </p>
                <div className="flex justify-center gap-4">
                    <Link href="/tools">
                        <Button size="lg" className="px-8 shadow-glow-sm">{t('about.cta.button')}</Button>
                    </Link>
                    <Link href="/">
                        <Button variant="ghost" size="lg">{t('about.cta.back')}</Button>
                    </Link>
                </div>
            </GlassCard>

            {/* Footer Credit */}
            <div className="mt-20 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
                {t('footer.builtBy', { name: t('footer.developerName') })}
            </div>
        </div>
    );
}
