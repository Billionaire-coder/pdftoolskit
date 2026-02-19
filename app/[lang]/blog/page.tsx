'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight, BookOpen } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ToolHeader } from '@/components/shared/ToolHeader';
import { getBlogPosts } from '@/data/blog-posts';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';

export default function BlogPage() {
    const { t } = useTranslation('common');
    const params = useParams();
    const lang = (params?.lang as string) || 'en';
    const posts = getBlogPosts(lang);

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-6xl">
            {/* Header */}
            <ToolHeader
                title={t('blog.title', 'PDF Tools Blog')}
                description={t('blog.description', 'Expert guides, tutorials, and tips to master PDF tools and boost your productivity.')}
                icon={BookOpen}
                color="from-purple-500 to-pink-500"
            />

            {/* Blog Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post, index) => (
                    <motion.div
                        key={post.slug}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Link href={`/blog/${post.slug}`}>
                            <GlassCard className="h-full flex flex-col group cursor-pointer hover:border-purple-500/50 transition-all duration-300 overflow-hidden">
                                {/* Pseud-Image Placeholder */}
                                <div className={`h-40 w-full ${post.image.includes('gradient') ? post.image : 'bg-slate-800'} relative overflow-hidden`}>
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
                                </div>

                                <div className="p-6 flex flex-col flex-1">
                                    {/* Category Badge */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <div className="inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                                            {post.category}
                                        </div>
                                    </div>


                                    {/* Title */}
                                    <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                                        {post.title}
                                    </h2>

                                    {/* Excerpt */}
                                    <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm line-clamp-3 flex-1">
                                        {post.excerpt}
                                    </p>

                                    {/* Meta Info */}
                                    <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-200 dark:border-slate-800">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            <span>{post.date}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>{post.readTime}</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center gap-2 text-purple-600 dark:text-purple-400 text-sm font-medium group-hover:gap-3 transition-all">
                                        {t('blog.readArticle', 'Read Article')}
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </GlassCard>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

