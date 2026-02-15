'use client';

import React from 'react';
import { Share2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
    className?: string;
}

export function ShareButton({ className }: ShareButtonProps) {
    const [copied, setCopied] = React.useState(false);

    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const shareData = {
            title: document.title,
            text: 'Check out this PDF tool!',
            url: window.location.href,
        };

        try {
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
                toast.success('Shared successfully!');
            } else {
                throw new Error('Web Share API not supported');
            }
        } catch (error) {
            // Fallback: Copy to clipboard
            try {
                await navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                toast.success('Link copied to clipboard!');
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                toast.error('Failed to copy link');
            }
        }
    };

    return (
        <button
            onClick={handleShare}
            className={cn(
                "group relative p-2 transition-all duration-300 text-slate-400 hover:text-white",
                className
            )}
            title="Share this page"
        >
            <AnimatePresence mode="wait">
                {copied ? (
                    <motion.div
                        key="check"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                    >
                        <Check className="w-5 h-5 text-green-400" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="share"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <Share2 className="w-5 h-5" />
                    </motion.div>
                )}
            </AnimatePresence>
        </button>
    );
}
