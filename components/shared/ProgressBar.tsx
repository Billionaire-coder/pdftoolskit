'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';

interface ProgressBarProps {
    progress: number;
    label?: string;
}

export function ProgressBar({ progress, label = 'Processing...' }: ProgressBarProps) {
    return (
        <GlassCard className="p-6">
            <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{label}</span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                            Local & Secure
                        </span>
                    </div>
                    <span className="text-accent font-semibold">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>
        </GlassCard>
    );
}
