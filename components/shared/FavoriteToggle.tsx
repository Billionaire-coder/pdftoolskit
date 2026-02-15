'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFavoritesStore } from '@/lib/stores/favorites-store';
import { cn } from '@/lib/utils';

interface FavoriteToggleProps {
    toolId: string;
    className?: string;
}

export function FavoriteToggle({ toolId, className }: FavoriteToggleProps) {
    const { toggleFavorite, isFavorite } = useFavoritesStore();
    const active = isFavorite(toolId);

    return (
        <button
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite(toolId);
            }}
            className={cn(
                "group relative p-2 transition-all duration-300",
                active ? "text-rose-500" : "text-slate-400 hover:text-white",
                className
            )}
            title={active ? "Remove from favorites" : "Add to favorites"}
        >
            <motion.div
                initial={false}
                animate={{
                    scale: active ? [1, 1.2, 1] : 1,
                    rotate: active ? [0, 10, -10, 0] : 0
                }}
                transition={{ duration: 0.3 }}
            >
                <Heart
                    className={cn(
                        "w-5 h-5 transition-all duration-300",
                        active ? "fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" : "fill-transparent"
                    )}
                />
            </motion.div>
        </button>
    );
}
