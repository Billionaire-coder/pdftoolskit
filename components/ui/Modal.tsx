'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    description?: string;
    className?: string;
}

export function Modal({
    isOpen,
    onClose,
    children,
    title,
    description,
    className
}: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    // Store the element that had focus before the modal opened
    const triggerRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (isOpen) {
            triggerRef.current = document.activeElement as HTMLElement;
            // Lock body scroll
            document.body.style.overflow = 'hidden';

            // Focus trap: simple timeout to ensure rendering
            setTimeout(() => {
                contentRef.current?.focus();
            }, 100);

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    onClose();
                }
                // Basic focus trap logic could go here (using tabbable)
                // For now, we rely on the modal content being the focus context
            };

            document.addEventListener('keydown', handleKeyDown);
            return () => {
                document.body.style.overflow = 'unset';
                document.removeEventListener('keydown', handleKeyDown);
                // Restore focus
                if (triggerRef.current) {
                    triggerRef.current.focus();
                }
            };
        }
    }, [isOpen, onClose]);

    // Portal to body (or specific root if available)
    if (typeof window === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby={title ? "modal-title" : undefined} aria-describedby={description ? "modal-description" : undefined}>
                    {/* Backdrop */}
                    <motion.div
                        ref={overlayRef}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        aria-hidden="true"
                    />

                    {/* Content */}
                    <motion.div
                        ref={contentRef}
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className={cn(
                            "relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden ring-1 ring-white/10 outline-none",
                            className
                        )}
                        tabIndex={-1}
                    >
                        {(title || description) && (
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                                {title && <h2 id="modal-title" className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>}
                                {description && <p id="modal-description" className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
                            </div>
                        )}

                        <div className="p-6">
                            {children}
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
