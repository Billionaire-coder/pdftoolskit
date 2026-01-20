'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight, BookOpen, Tag } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { blogPosts } from '@/data/blog-posts';

export default function BlogPage() {
    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-6xl">
            {/* Header */}
            <div className="text-center mb-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-6 shadow-glow"
                >
                    <BookOpen className="w-12 h-12 text-white" />
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-3xl md:text-5xl font-heading font-bold gradient-text mb-4"
                >
                    PDF Tools Blog
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg text-slate-300 max-w-2xl mx-auto"
                >
                    Expert guides, tutorials, and tips to master PDF tools and boost your productivity.
                </motion.p>
            </div>

            {/* Blog Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogPosts.map((post, index) => (
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
                                        <div className="inline-block px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
                                            {post.category}
                                        </div>
                                    </div>


                                    {/* Title */}
                                    <h2 className="text-xl font-heading font-bold text-white mb-3 group-hover:text-purple-400 transition-colors line-clamp-2">
                                        {post.title}
                                    </h2>

                                    {/* Excerpt */}
                                    <p className="text-slate-400 mb-6 text-sm line-clamp-3 flex-1">
                                        {post.excerpt}
                                    </p>

                                    {/* Meta Info */}
                                    <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-800">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            <span>{post.date}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-purple-400">
                                            <span>Read Article</span>
                                            <ArrowRight className="w-3 h-3" />
                                        </div>
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
