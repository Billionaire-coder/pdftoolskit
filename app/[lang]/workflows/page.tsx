'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Plus, Layers, Zap, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function WorkflowsLandingPage() {
    const presets = [
        {
            title: 'Merge & Compress',
            description: 'Combine multiple PDFs and reduce file size for sharing.',
            icon: <Layers className="w-6 h-6 text-blue-400" />,
            steps: ['Merge', 'Compress'],
            color: 'from-blue-500/20 to-cyan-500/20'
        },
        {
            title: 'Secure Document',
            description: 'Add watermark and password protection.',
            icon: <ShieldCheck className="w-6 h-6 text-purple-400" />,
            steps: ['Watermark', 'Protect'],
            color: 'from-purple-500/20 to-pink-500/20'
        },
        {
            title: 'Quick Cleanup',
            description: 'Rotate valid pages and compress.',
            icon: <Zap className="w-6 h-6 text-amber-400" />,
            steps: ['Rotate', 'Compress'],
            color: 'from-amber-500/20 to-orange-500/20'
        }
    ];

    return (
        <div className="container mx-auto px-4 py-20 lg:py-32">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-8 shadow-glow"
                    >
                        <Zap className="w-12 h-12 text-white" />
                    </motion.div>

                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 mb-6"
                    >
                        Automate Your PDF Tasks
                    </motion.h1>

                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto"
                    >
                        Chain multiple tools together to create powerful custom workflows.
                        Save time by automating repetitive actions.
                    </motion.p>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Link
                            href="/workflows/create"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-lg transition-all shadow-lg shadow-blue-500/25 group"
                        >
                            <Plus className="w-5 h-5" />
                            Create New Workflow
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {presets.map((preset, index) => (
                        <motion.div
                            key={index}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 + (index * 0.1) }}
                            className="group relative p-1 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 hover:from-blue-500/50 hover:to-indigo-500/50 transition-all duration-300"
                        >
                            <div className="absolute inset-0 rounded-3xl bg-white/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative h-full bg-slate-900/90 backdrop-blur-xl rounded-[22px] p-6 border border-white/10 overflow-hidden">
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${preset.color} blur-3xl rounded-full translate-x-10 -translate-y-10`} />

                                <div className="relative z-10">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                                        {preset.icon}
                                    </div>

                                    <h3 className="text-xl font-semibold text-white mb-2">{preset.title}</h3>
                                    <p className="text-slate-400 text-sm mb-6">{preset.description}</p>

                                    <div className="flex flex-wrap gap-2">
                                        {preset.steps.map((step, i) => (
                                            <div key={i} className="flex items-center text-xs font-medium text-slate-300">
                                                <span className="px-2 py-1 rounded-md bg-white/5 border border-white/5">
                                                    {step}
                                                </span>
                                                {i < preset.steps.length - 1 && (
                                                    <ArrowRight className="w-3 h-3 mx-1 text-slate-600" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
