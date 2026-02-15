'use client';

import React from 'react';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ProBadgeProps {
    className?: string;
    showIcon?: boolean;
    variant?: 'small' | 'default' | 'large';
}

export function ProBadge({ className, showIcon = true, variant = 'default' }: ProBadgeProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "inline-flex items-center gap-1 font-bold tracking-wider rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 border border-amber-300/50 shadow-lg shadow-amber-500/20",
                variant === 'small' ? "text-[10px] px-1.5 py-0.5" :
                    variant === 'large' ? "text-sm px-3 py-1" :
                        "text-[11px] px-2 py-0.5",
                className
            )}
        >
            {showIcon && <Crown className={cn(variant === 'small' ? "w-2.5 h-2.5" : "w-3 h-3")} />}
            PRO
        </motion.div>
    );
}

export default ProBadge;
