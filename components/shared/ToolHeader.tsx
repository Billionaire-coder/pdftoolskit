'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FavoriteToggle } from './FavoriteToggle';
import { ShareButton } from './ShareButton';
import { motion } from 'framer-motion';
import { DynamicIcon } from './DynamicIcon';

interface ToolHeaderProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    iconName?: string;
    toolId?: string;
    color?: string; // e.g., "from-purple-500 to-pink-500"
}

export function ToolHeader({ title, description, icon: Icon, iconName, toolId, color }: ToolHeaderProps) {
    return (
        <div className="text-center mb-12 relative">
            <div className="relative inline-flex items-center justify-center mb-6 group">
                {/* Watermark Icon */}
                {(Icon || iconName) && (
                    <div className="absolute -bottom-10 -right-10 opacity-[0.07] group-hover:opacity-[0.15] transition-opacity duration-500 pointer-events-none">
                        {Icon ? <Icon className="w-40 h-40 rotate-12" /> : <DynamicIcon name={iconName!} className="w-40 h-40 rotate-12" />}
                    </div>
                )}

                {/* Tool Icon */}
                {(Icon || iconName) && (
                    <motion.div
                        className={cn(
                            "p-4 rounded-2xl bg-gradient-to-br shadow-glow transition-transform duration-500 hover:scale-105 relative z-10",
                            color || "from-primary to-secondary"
                        )}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                    >
                        {Icon ? <Icon className="w-12 h-12 text-white" /> : <DynamicIcon name={iconName!} className="w-12 h-12 text-white" />}
                    </motion.div>
                )}

                {/* Favorite Heart - Positioned top-center (half-on, half-off) */}
                {toolId && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                        <FavoriteToggle toolId={toolId} />
                    </div>
                )}

                {/* Share Button - Restored to its original relative position on the right */}
                <div className="absolute top-8 -right-8 md:-right-12">
                    <ShareButton />
                </div>
            </div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
            >
                <h1 className="text-3xl md:text-5xl font-heading font-bold gradient-text mb-4">
                    {title}
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto px-4">
                    {description}
                </p>
            </motion.div>
        </div>
    );
}
