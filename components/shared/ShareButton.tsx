'use client';

import React from 'react';
import { Share2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
    className?: string;
    url?: string;
    title?: string;
    text?: string;
}

export function ShareButton({ className, url, title, text }: ShareButtonProps) {
    const [copied, setCopied] = React.useState(false);

    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Use provided URL or fallback to current window URL
        const shareUrl = url ? (url.startsWith('http') ? url : `${window.location.origin}${url}`) : window.location.href;
        const shareTitle = title || document.title;
        const shareText = text || 'Check out this PDF tool!';

        const shareData = {
            title: shareTitle,
            text: shareText,
            url: shareUrl,
        };

        try {
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
                toast.success('Shared successfully!');
            } else {
                throw new Error('Web Share API not supported');
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            // If user cancelled share, do nothing
            if (error.name === 'AbortError') return;

            // Fallback: Copy to clipboard
            try {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                toast.success('Link copied to clipboard!');
                setTimeout(() => setCopied(false), 2000);
            } catch (_err) {
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
