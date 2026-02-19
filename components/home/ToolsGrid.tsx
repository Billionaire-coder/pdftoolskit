'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { FavoriteToggle } from '@/components/shared/FavoriteToggle';
import { ShareButton } from '@/components/shared/ShareButton';
import { tools } from '@/data/tools';


import { useTranslation } from 'react-i18next';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ToolCard({ tool, index: _index = 0 }: { tool: any, index?: number }) {
    const { t } = useTranslation('common');
    return (
        <Link href={tool.href} prefetch={false}>
            <GlassCard
                variant="tool"
                className="h-full p-6 group cursor-pointer relative overflow-hidden"
                animate={false}
            >
                {/* Watermark Icon */}
                <div className="absolute -bottom-8 -right-8 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-500 pointer-events-none">
                    <tool.icon className="w-48 h-48 rotate-12" />
                </div>

                {/* Favorite Heart - Positioned top-right */}
                <div className="absolute top-2 right-2 z-10">
                    <FavoriteToggle toolId={tool.id} className="p-1.5" />
                </div>

                {/* Icon */}
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${tool.color} mb-4 shadow-glow group-hover:scale-110 transition-transform duration-300`}>
                    <tool.icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-heading font-semibold text-slate-900 dark:text-white mb-2 group-hover:gradient-text transition-all duration-300">
                    {t(`tools.${tool.id}`)}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed overflow-hidden line-clamp-2">
                    {t(`tools.${tool.id}Desc`)}
                </p>

                {/* Footer Actions */}
                <div className="mt-4 flex items-center justify-between">
                    {/* Share Button - Positioned bottom-left */}
                    {/* Share Button - Positioned bottom-left */}
                    <div className="z-10">
                        <ShareButton
                            className="p-1.5"
                            url={tool.href}
                            title={`${t(`tools.${tool.id}`)} - PDFToolskit`}
                            text={t(`tools.${tool.id}Desc`)}
                        />
                    </div>

                    {/* Arrow indicator */}
                    <div className="flex items-center text-sm text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="hidden sm:inline">{t('toolsSection.useTool')}</span>
                        <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            </GlassCard>
        </Link>
    );
}

export function ToolsGrid() {
    const { t } = useTranslation('common');

    return (
        <section id="tools" className="py-20 lg:py-32">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <motion.h2
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl md:text-5xl font-heading font-bold gradient-text mb-4"
                    >
                        {t('toolsSection.title')}
                    </motion.h2>
                    <motion.p
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto"
                    >
                        {t('toolsSection.subtitle')}
                    </motion.p>
                </div>

                {/* Tools Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {tools.map((tool, index) => (
                        <motion.div
                            key={tool.href}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.05 }}
                        >
                            <ToolCard tool={tool} index={index} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
