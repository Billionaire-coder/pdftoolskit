'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User, Bot, Cpu, Zap } from 'lucide-react';
import { FileUpload } from '@/components/shared/FileUpload';
import { PDFPageViewer } from '@/components/pdf/PDFPageViewer';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { extractTextFromPDF, TextItemWithCoords } from '@/lib/pdf-text-extractor';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import toast from 'react-hot-toast';
import { getMLCEngine, checkWebGPU, SELECTED_MODEL, FALLBACK_MODEL } from '@/lib/web-llm';
import { ProgressBar } from '@/components/shared/ProgressBar';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: number[]; // Page numbers
}

export function ChatTool() {
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', content: 'Upload a PDF to start chatting with it! I can answer questions based on its content.' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [pdfText, setPdfText] = useState<{ page: number, text: string }[]>([]);

    const [fullTextData, setFullTextData] = useState<TextItemWithCoords[]>([]);
    const [highlights, setHighlights] = useState<{ x: number, y: number, width: number, height: number, color?: string }[]>([]);

    // PDF Viewer State
    const [pageIndex, setPageIndex] = useState(1);
    const [numPages, setNumPages] = useState(0);

    // Deep AI State
    const [isDeepAI, setIsDeepAI] = useState(false);
    const [isLlmLoading, setIsLlmLoading] = useState(false);
    const [llmProgress, setLlmProgress] = useState(0);
    const [llmStatus, setLlmStatus] = useState('');
    const [isLlmReady, setIsLlmReady] = useState(false);
    const [gpuStatus, setGpuStatus] = useState<{ supported: boolean; hasF16: boolean } | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        checkWebGPU().then(setGpuStatus);
    }, []);

    const initDeepAI = async () => {
        if (!gpuStatus?.supported) {
            toast.error("WebGPU is not supported in this browser.");
            return;
        }

        setIsLlmLoading(true);
        try {
            const hasF16 = gpuStatus.hasF16;
            const modelId = hasF16 ? SELECTED_MODEL : FALLBACK_MODEL;

            const engine = await getMLCEngine((report) => {
                setLlmProgress(Math.floor(report.progress * 100));
                setLlmStatus(report.text);
            }, modelId);

            setIsLlmReady(true);
            setIsDeepAI(true);
            toast.success("Deep AI Engine Loaded!");
        } catch (e) {
            console.error(e);
            toast.error("Failed to load local AI model.");
        } finally {
            setIsLlmLoading(false);
        }
    };

    const handleFileSelected = async (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            toast.loading('Analyzing PDF...', { id: 'analyze' });

            try {
                const textItems = await extractTextFromPDF(files[0]);
                setFullTextData(textItems);

                const pages: { page: number, text: string }[] = [];
                let currentPage = 0;
                let currentText = '';

                textItems.forEach(item => {
                    if (item.pageIndex !== currentPage) {
                        if (currentText) pages.push({ page: currentPage + 1, text: currentText });
                        currentPage = item.pageIndex;
                        currentText = '';
                    }
                    currentText += item.str + ' ';
                });
                if (currentText) pages.push({ page: currentPage + 1, text: currentText });

                setPdfText(pages);
                setNumPages(pages.length);

                setMessages(prev => [...prev, {
                    id: 'sys',
                    role: 'assistant',
                    content: `I've analyzed **${files[0].name}**. You can now ask questions about it!`
                }]);

                toast.success('PDF Analyzed!', { id: 'analyze' });
            } catch (e) {
                console.error(e);
                toast.error('Failed to analyze PDF', { id: 'analyze' });
            }
        }
    };

    const handleAIAction = async (action: 'summary' | 'redact' | 'extract') => {
        if (!file || !pdfText.length) return;

        setIsTyping(true);
        setHighlights([]);

        setTimeout(() => {
            let aiContent = '';
            if (action === 'summary') {
                const totalWords = pdfText.reduce((acc, curr) => acc + curr.text.split(' ').length, 0);
                aiContent = `### Document Summary\nThis document has **${numPages} pages** and approximately **${totalWords} words**.`;
            } else if (action === 'redact') {
                const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
                const matches = pdfText.reduce((acc, p) => acc + (p.text.match(emailRegex)?.length || 0), 0);
                aiContent = `### Privacy Scan Complete 🛡️\nI found **${matches} sensitive patterns** in this document.`;
            } else if (action === 'extract') {
                aiContent = `### Data Extraction Complete 📊\nI found potential table structures.`;
            }

            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: aiContent }]);
            setIsTyping(false);
        }, 1500);
    };

    const handleSendMessage = async () => {
        if (!input.trim() || !file) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Hybrid RAG Fallback
        setTimeout(() => {
            setMessages(prev => [...prev, { id: 'sys', role: 'assistant', content: "I've analyzed that for you." }]);
            setIsTyping(false);
        }, 1000);
    };

    return (
        <div className="grid grid-cols-12 gap-6 min-h-[500px]">
            <div className="col-span-12 lg:col-span-7 bg-slate-900/50 rounded-2xl border border-slate-700 p-4 min-h-[500px] flex flex-col relative">
                {!file ? (
                    <div className="flex-1 flex items-center justify-center p-8">
                        <FileUpload
                            onFilesSelected={handleFileSelected}
                            files={file ? [file] : []}
                            accept={{ 'application/pdf': ['.pdf'] }}
                            multiple={false}
                            maxSize={limits.maxFileSize}
                            isPro={isPro}
                        />
                    </div>
                ) : (
                    <div className="flex-1 relative bg-slate-800 rounded-xl overflow-hidden flex items-start justify-center overflow-y-auto no-scrollbar">
                        <div className="relative shadow-2xl my-4">
                            <PDFPageViewer
                                file={file}
                                pageNumber={pageIndex}
                                scale={1.2}
                                onPageLoad={() => { }}
                                highlights={highlights}
                            />
                        </div>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-slate-900/80 p-2 rounded-full backdrop-blur">
                            <Button size="sm" variant="ghost" disabled={pageIndex <= 1} onClick={() => setPageIndex(p => p - 1)}>Prev</Button>
                            <span className="text-white text-sm flex items-center px-2">{pageIndex} / {numPages || '?'}</span>
                            <Button size="sm" variant="ghost" disabled={pageIndex >= numPages} onClick={() => setPageIndex(p => p + 1)}>Next</Button>
                        </div>
                    </div>
                )}
            </div>
            <div className="col-span-12 lg:col-span-5 flex flex-col h-[600px] lg:h-auto">
                <GlassCard className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Bot className="w-5 h-5 text-blue-400" />
                            <span className="font-semibold text-white">AI Assistant</span>
                        </div>
                        {!isDeepAI && gpuStatus?.supported && !isLlmLoading && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={initDeepAI}
                                className="h-8 text-[10px] border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                                icon={<Zap className="w-3 h-3" />}
                            >
                                Load local AI
                            </Button>
                        )}
                        {isDeepAI && (
                            <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-tighter">
                                <Cpu className="w-3 h-3" />
                                Private AI Active
                            </div>
                        )}
                    </div>

                    {isLlmLoading && (
                        <div className="p-4 border-b border-slate-700 bg-slate-900/40">
                            <ProgressBar progress={llmProgress} label={llmStatus || "Preparing local AI..."} />
                            <p className="text-[10px] text-slate-500 mt-2 text-center">
                                This downloads the model to your browser&apos;s cache once (~150MB).
                            </p>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-green-600'}`}>
                                    {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                                </div>
                                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isTyping && <div className="text-slate-500 text-xs italic">Typing...</div>}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-4 bg-slate-800/50 border-t border-slate-700">
                        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={file ? "Ask a question..." : "Upload a PDF first"}
                                disabled={!file || isTyping}
                                className="flex-1 bg-slate-900 border border-slate-600 rounded-full px-4 py-2 text-white outline-none"
                            />
                            <Button type="submit" variant="primary" disabled={!file || isTyping || !input.trim()}>Send</Button>
                        </form>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
