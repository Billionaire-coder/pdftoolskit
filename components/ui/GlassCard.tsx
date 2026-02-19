'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'highlight' | 'tool';
    hover?: boolean;
    animate?: boolean;
}

export function GlassCard({
    children,
    className,
    variant = 'default',
    hover = true,
    animate = true
}: GlassCardProps) {
    const baseStyles = 'rounded-2xl transition-all duration-300';

    const variants = {
        default: 'glass shadow-glass',
        highlight: 'glass-lg shadow-glass-lg border-primary/30',
        tool: 'glass shadow-glass hover:shadow-glass-lg',
    };

    const Component = animate ? motion.div : 'div';
    // eslint-disable-next-line security/detect-object-injection
    const animationProps = animate ? {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 }
    } : {};

    return (
        <Component
            className={cn(
                baseStyles,
                // eslint-disable-next-line security/detect-object-injection
                variants[variant],
                hover && 'glass-hover hover:scale-[1.02]',
                className
            )}
            {...animationProps}
        >
            {children}
        </Component>
    );
}
