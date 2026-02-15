'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Heart, ChevronDown, ExternalLink, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFavoritesStore } from '@/lib/stores/favorites-store';
import { tools } from '@/data/tools';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui/GlassCard';

export function MyToolsMenu() {
    const { t } = useTranslation('common');
    const { favorites, removeFavorite } = useFavoritesStore();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const favoriteTools = tools.filter(tool => favorites.includes(tool.id));

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300",
                    "hover:bg-slate-900/5 dark:hover:bg-white/5 group",
                    isOpen ? "bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"
                )}
            >
                <div className="relative">
                    <Heart className={cn(
                        "w-4 h-4 transition-all duration-300",
                        favorites.length > 0 ? "fill-rose-500 text-rose-500" : "text-slate-600 dark:text-slate-400"
                    )} />
                    {favorites.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        </span>
                    )}
                </div>
                <span className="text-sm font-medium hidden lg:block">My Tools</span>
                <ChevronDown className={cn(
                    "w-4 h-4 transition-transform duration-300",
                    isOpen ? "rotate-180" : ""
                )} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-72 z-[100]"
                    >
                        <GlassCard className="p-2 overflow-hidden" variant="highlight">
                            <div className="p-3 border-b border-slate-200 dark:border-white/10 mb-2 flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Favorite Tools ({favoriteTools.length})
                                </span>
                                {favoriteTools.length === 0 && (
                                    <Heart className="w-3 h-3 text-slate-600" />
                                )}
                            </div>

                            <div className="max-h-80 overflow-y-auto space-y-1 custom-scrollbar">
                                {favoriteTools.length > 0 ? (
                                    favoriteTools.map((tool) => (
                                        <div key={tool.id} className="group relative">
                                            <Link
                                                href={tool.href}
                                                onClick={() => setIsOpen(false)}
                                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-900/5 dark:hover:bg-white/10 transition-colors"
                                            >
                                                <div className={cn(
                                                    "p-2 rounded-lg bg-gradient-to-br",
                                                    tool.color
                                                )}>
                                                    <tool.icon className="w-4 h-4 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                                        {tool.name}
                                                    </div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                        {tool.category}
                                                    </div>
                                                </div>
                                                <ExternalLink className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </Link>

                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    removeFavorite(tool.id);
                                                }}
                                                className="absolute top-1/2 -right-1 -translate-y-1/2 p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 px-4 text-center">
                                        <div className="bg-white/5 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                                            <Heart className="w-6 h-6 text-slate-600" />
                                        </div>
                                        <p className="text-sm text-slate-400">No tools favorited yet.</p>
                                        <p className="text-xs text-slate-500 mt-1">Heart your favorite tools for quick access!</p>
                                    </div>
                                )}
                            </div>

                            {favoriteTools.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-white/10">
                                    <Link
                                        href="/tools"
                                        onClick={() => setIsOpen(false)}
                                        className="block text-center py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                    >
                                        Browse all tools
                                    </Link>
                                </div>
                            )}
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
