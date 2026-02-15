'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, DollarSign, Infinity } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTranslation } from 'react-i18next';

export function Features() {
    const { t } = useTranslation('common');

    const features = [
        {
            name: t('features.fast'),
            description: t('features.fastDesc'),
            icon: Zap,
        },
        {
            name: t('features.secure'),
            description: t('features.secureDesc'),
            icon: Shield,
        },
        {
            name: t('features.free'),
            description: t('features.freeDesc'),
            icon: DollarSign,
        },
        {
            name: t('features.unlimited'),
            description: t('features.unlimitedDesc'),
            icon: Infinity,
        },
    ];

    return (
        <section id="about" className="py-20 lg:py-32">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <motion.h2
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl md:text-5xl font-heading font-bold gradient-text mb-4"
                    >
                        {t('features.title')}
                    </motion.h2>
                    <motion.p
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto"
                    >
                        {t('features.subtitle')}
                    </motion.p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index} // Can't depend on translated name for key
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <GlassCard className="h-full p-6 text-center">
                                {/* Icon */}
                                <div className="inline-flex p-4 rounded-2xl glass-lg mb-4 group-hover:bg-white/10 transition-colors duration-300">
                                    <feature.icon className="w-8 h-8 text-accent" />
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-heading font-semibold text-slate-900 dark:text-white mb-3">
                                    {feature.name}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>

                {/* CTA Section */}
                <motion.div
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mt-20"
                >
                    <GlassCard variant="highlight" className="p-8 md:p-12 text-center">
                        <h3 className="text-2xl md:text-3xl font-heading font-bold gradient-text mb-4">
                            {t('cta.title')}
                        </h3>
                        <p className="text-lg text-slate-600 dark:text-slate-300 mb-6 max-w-2xl mx-auto">
                            {t('cta.description')}
                        </p>
                        <button
                            onClick={() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' })}
                            className="btn-primary"
                        >
                            {t('cta.button')}
                        </button>
                    </GlassCard>
                </motion.div>
            </div>
        </section>
    );
}
