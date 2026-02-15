'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ToolCard } from '@/components/home/ToolsGrid';
import { tools, ToolCategory } from '@/data/tools';
import { useTranslation } from 'react-i18next';
import { ToolHeader } from '@/components/shared/ToolHeader';
import { LayoutGrid } from 'lucide-react';

export default function ToolsPage() {
    const { t } = useTranslation('common');
    const [activeCategory, setActiveCategory] = useState<ToolCategory | 'All'>('All');

    const categories: { label: string; value: ToolCategory | 'All' }[] = [
        { label: t('categories.all'), value: 'All' },
        { label: t('categories.workflows'), value: 'Workflows' },
        { label: t('categories.organize'), value: 'Organize PDF' },
        { label: t('categories.optimize'), value: 'Optimize PDF' },
        { label: t('categories.convert'), value: 'Convert PDF' },
        { label: t('categories.edit'), value: 'Edit PDF' },
        { label: t('categories.security'), value: 'PDF Security' }
    ];

    const filteredTools = activeCategory === 'All'
        ? tools
        : tools.filter(tool => tool.category === activeCategory);

    return (
        <div className="container mx-auto px-4 py-12 md:py-20">
            {/* Header Section */}
            <ToolHeader
                title={t('toolsPage.title')}
                description={t('toolsPage.subtitle')}
                icon={LayoutGrid}
                color="from-primary to-purple-600"
            />

            {/* Category Tabs */}
            <div className="mb-12 overflow-x-auto pb-4">
                <div className="flex justify-center min-w-max md:min-w-0 gap-2 md:gap-4 px-4">
                    {categories.map((cat) => (
                        <button
                            key={cat.value}
                            onClick={() => setActiveCategory(cat.value)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeCategory === cat.value
                                ? 'bg-gradient-primary text-white shadow-lg shadow-purple-500/25'
                                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredTools.map((tool, index) => (
                    <motion.div
                        key={tool.href}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <ToolCard tool={tool} index={index} />
                    </motion.div>
                ))}
            </div>

            {/* Empty State */}
            {filteredTools.length === 0 && (
                <div className="text-center py-20">
                    <p className="text-slate-400 text-lg">{t('toolsPage.noTools')}</p>
                </div>
            )}
        </div>
    );
}
