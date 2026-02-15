'use client';

import React, { useEffect, useState } from 'react';
import { History, X, Download, Trash2, FileText, File } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { getHistory, HistoryItem, deleteHistoryItem, clearHistory } from '@/lib/history-store';
import { downloadFile, formatFileSize } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export function HistorySidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const [items, setItems] = useState<HistoryItem[]>([]);

    const loadHistory = async () => {
        const history = await getHistory();
        setItems(history);
    };

    useEffect(() => {
        if (isOpen) {
            loadHistory();
        }
    }, [isOpen]);

    // Expose a global event listener to refresh history?
    // Or just interval? Let's use interval for now or keep it simple (load on open).

    const handleDownload = (item: HistoryItem) => {
        if (item.blob) {
            downloadFile(item.blob, item.fileName);
        } else {
            toast.error('File data not found');
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await deleteHistoryItem(id);
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const handleClearAll = async () => {
        if (confirm('Clear all history?')) {
            await clearHistory();
            setItems([]);
        }
    };

    return (
        <>
            {/* Float Button */}
            <motion.button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-20 start-6 z-50 p-4 rounded-full bg-slate-900 border border-slate-700 shadow-xl text-white hover:scale-110 transition-transform group"
                whileHover={{ rotate: 15 }}
                title="Recent Files"
            >
                <History className="w-6 h-6 text-blue-400" />
                <span className="absolute start-14 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-700 pointer-events-none">
                    Recent Files
                </span>
            </motion.button>

            {/* Sidebar */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />

                        {/* Panel */}
                        <motion.div
                            exit={{ opacity: -100 }}
                            className="fixed start-0 top-0 bottom-0 w-full max-w-sm bg-slate-900 border-e border-slate-700 z-[100] shadow-2xl flex flex-col"
                        >
                            <div className="p-6 border-b border-slate-700 flex items-center justify-between bg-slate-900/50">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <History className="w-5 h-5 text-blue-400" />
                                    Recent Files
                                </h2>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {items.length === 0 ? (
                                    <div className="text-center text-slate-500 py-10">
                                        <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>No recent files yet.</p>
                                        <p className="text-xs mt-1">Processed files will appear here.</p>
                                    </div>
                                ) : (
                                    items.map(item => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl group relative hover:border-blue-500/50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                                    <FileText className="w-5 h-5 text-blue-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-medium text-white truncate" title={item.fileName}>
                                                        {item.fileName}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                                        <span className="capitalize px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                                                            {item.tool}
                                                        </span>
                                                        <span>•</span>
                                                        <span>{formatFileSize(item.size)}</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 mt-1">
                                                        {new Date(item.timestamp).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-3 flex gap-2">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="w-full text-xs h-8"
                                                    onClick={() => handleDownload(item)}
                                                    icon={<Download className="w-3 h-3" />}
                                                >
                                                    Download
                                                </Button>
                                                <button
                                                    onClick={(e) => handleDelete(e, item.id)}
                                                    className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            {items.length > 0 && (
                                <div className="p-4 border-t border-slate-700 bg-slate-900/50">
                                    <Button
                                        variant="outline"
                                        className="w-full border-red-900/30 text-red-400 hover:bg-red-500/10"
                                        onClick={handleClearAll}
                                        icon={<Trash2 className="w-4 h-4" />}
                                    >
                                        Clear History
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
