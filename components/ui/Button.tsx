'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: React.ReactNode;
}

export function Button({
    children,
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-300 focus-ring disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px]';

    const variants = {
        primary: 'bg-gradient-primary text-white shadow-glass hover:shadow-glow hover:scale-105',
        secondary: 'glass glass-hover shadow-glass',
        ghost: 'hover:bg-white/5 hover:shadow-glass',
        outline: 'border border-white/20 hover:bg-white/5 hover:border-white/40',
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm min-h-[44px]',
        md: 'px-6 py-3 text-base min-h-[44px]',
        lg: 'px-8 py-4 text-lg min-h-[44px]',
    };

    return (
        <motion.button
            className={cn(
                baseStyles,
                // eslint-disable-next-line security/detect-object-injection
                variants[variant],
                // eslint-disable-next-line security/detect-object-injection
                sizes[size],
                className
            )}
            whileTap={{ scale: 0.95 }}
            disabled={disabled || loading}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...(props as any)}
        >
            {loading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                </>
            ) : (
                <>
                    {icon && <span>{icon}</span>}
                    {children}
                </>
            )}
        </motion.button>
    );
}
