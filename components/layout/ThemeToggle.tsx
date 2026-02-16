'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { motion } from 'framer-motion';

export function ThemeToggle() {
    const [mounted, setMounted] = useState(false);

    // Only access theme context after component has mounted (client-side only)
    useEffect(() => {
        setMounted(true);
    }, []);

    // Don't call useTheme during SSR - return placeholder
    if (!mounted) {
        return (
            <div className="relative p-2 rounded-lg glass w-10 h-10" aria-label="Toggle theme">
                <div className="w-6 h-6" />
            </div>
        );
    }

    return <ThemeToggleClient />;
}

function ThemeToggleClient() {
    const { theme, toggleTheme } = useTheme();

    return (

        <motion.button
            onClick={toggleTheme}
            className="relative p-1.5 w-8 h-8 rounded-lg glass hover:bg-slate-900/5 dark:hover:bg-white/10 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Toggle theme"
        >
            <div className="relative w-6 h-6">
                <motion.div
                    initial={false}
                    animate={{
                        scale: theme === 'dark' ? 1 : 0,
                        opacity: theme === 'dark' ? 1 : 0,
                        rotate: theme === 'dark' ? 0 : 180,
                    }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <Moon className="w-4 h-4 text-yellow-300" />
                </motion.div>
                <motion.div
                    initial={false}
                    animate={{
                        scale: theme === 'light' ? 1 : 0,
                        opacity: theme === 'light' ? 1 : 0,
                        rotate: theme === 'light' ? 0 : -180,
                    }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <Sun className="w-4 h-4 text-yellow-500" />
                </motion.div>
            </div>
        </motion.button>
    );
}
