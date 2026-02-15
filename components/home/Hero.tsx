'use client';

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Lucide } from '@/lib/lucide-registry';
import { Button } from '@/components/ui/Button';
import { tools } from '@/data/tools';

import { useTranslation } from 'react-i18next';

function AnimatedCount({ to }: { to: number }) {
    const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current) => Math.round(current));
    const [count, setCount] = useState(0);

    useEffect(() => {
        spring.set(to);
    }, [to, spring]);

    useEffect(() => {
        const unsubscribe = display.on("change", (latest) => {
            setCount(latest);
        });
        return unsubscribe;
    }, [display]);

    return <span>{count}</span>;
}

export function Hero() {
    const { t } = useTranslation('common');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Return a placeholder or the content without dynamic i18n if not mounted to be safe
    // Actually with static 'en' it should be fine, but 'mounted' helps with framer-motion too

    return (
        <section className="relative overflow-hidden py-20 lg:py-32">
            {/* Floating gradient orbs ... same ... */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
            </div>

            <div className="relative container mx-auto px-4">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <motion.div
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8"
                    >
                        <Lucide.Sparkles className="w-4 h-4 text-accent" />
                        <span className="text-sm font-medium">
                            {mounted ? t('hero.badge') : '100% Free • Secure • No Signup'}
                        </span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 leading-tight"
                    >
                        <span className="gradient-text">{t('hero.title')}</span>
                        <br />
                        {t('hero.titleHighlight')}
                    </motion.h1>

                    {/* Description */}
                    <motion.p
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed"
                    >
                        {t('hero.description')}
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Button
                            variant="primary"
                            size="lg"
                            icon={<Lucide.ArrowRight className="w-5 h-5" />}
                            onClick={() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            {t('hero.start')}
                        </Button>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
                    >
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-heading font-bold gradient-text mb-2">
                                <AnimatedCount to={tools.length} />+
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">{t('stats.tools')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-heading font-bold gradient-text mb-2">
                                ∞
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">{t('stats.noLimit')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-heading font-bold gradient-text mb-2">
                                100%
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">{t('stats.secure')}</div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
