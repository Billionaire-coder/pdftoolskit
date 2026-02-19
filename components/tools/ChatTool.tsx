'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User, Bot, Zap, Search, BookOpen, ShieldCheck, Activity, BrainCircuit, Gauge, FileText, Hash } from 'lucide-react';
import { FileUpload } from '@/components/shared/FileUpload';
import { PDFPageViewer } from '@/components/pdf/PDFPageViewer';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { extractTextFromPDF, TextItemWithCoords } from '@/lib/pdf-text-extractor';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import toast from 'react-hot-toast';
import { getMLCEngine, checkWebGPU, SELECTED_MODEL, FALLBACK_MODEL, streamChatCompletion } from '@/lib/web-llm';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { extractChunks, getRelevantContext, buildRAGPrompt, Chunk } from '@/lib/services/ai/rag';
import { cn } from '@/lib/utils';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: { page: number; chunk: number }[];
}

export function ChatTool() {
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', content: 'Initialize document archival to begin semantic interrogation.' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [_pdfText, setPdfText] = useState<{ page: number, text: string }[]>([]);
    const [chunks, setChunks] = useState<Chunk[]>([]);
    const [_activeSources, setActiveSources] = useState<Chunk[]>([]);

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
    const [_isLlmReady, setIsLlmReady] = useState(false);
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
        setLlmStatus("Syncing neural weights...");
        try {
            const hasF16 = gpuStatus.hasF16;
            const modelId = hasF16 ? SELECTED_MODEL : FALLBACK_MODEL;

            await getMLCEngine((report) => {
                setLlmProgress(Math.floor(report.progress * 100));
                setLlmStatus(report.text);
            }, modelId);

            setIsLlmReady(true);
            setIsDeepAI(true);
            toast.success("Intelligence Engine Online");
        } catch (e) {
            console.error(e);
            toast.error("Engine failure: Check GPU compatibility");
        } finally {
            setIsLlmLoading(false);
        }
    };

    const handleFileSelected = async (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            toast.loading('Analyzing document entropy...', { id: 'analyze' });

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
                setChunks(extractChunks(textItems));
                setNumPages(pages.length);

                setMessages([{
                    id: 'sys',
                    role: 'assistant',
                    content: `Archival complete for **${files[0].name}**. Vectorization successful. I am ready for interrogation.`
                }]);

                toast.success('Vectorization Complete', { id: 'analyze' });
            } catch (e) {
                console.error(e);
                toast.error('Analysis failed', { id: 'analyze' });
            }
        }
    };

    const handleJumpToSource = (page: number, text: string) => {
        setPageIndex(page);

        // Find rough coordinates for highlighting
        const match = fullTextData.find(item => item.pageIndex === page - 1 && text.includes(item.str));
        if (match) {
            setHighlights([{
                x: match.x,
                y: match.y,
                width: 200, // Approximate
                height: 15,
                color: 'rgba(139, 92, 246, 0.3)'
            }]);
            setTimeout(() => setHighlights([]), 3000);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || !file) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const assistantMsgId = (Date.now() + 1).toString();

            if (isDeepAI && chunks.length > 0) {
                const relevantChunks = getRelevantContext(input, chunks);
                setActiveSources(relevantChunks);
                const systemPrompt = buildRAGPrompt(input, relevantChunks);

                setMessages(prev => [...prev, {
                    id: assistantMsgId,
                    role: 'assistant',
                    content: '',
                    sources: relevantChunks.map(c => ({ page: c.pageIndex + 1, chunk: 0 }))
                }]);

                await streamChatCompletion(
                    [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: input }
                    ],
                    (text) => {
                        setMessages(prev => prev.map(m =>
                            m.id === assistantMsgId ? { ...m, content: text } : m
                        ));
                    }
                );
            } else {
                // LIGHT RETRIEVAL FALLBACK
                setTimeout(() => {
                    const relevant = getRelevantContext(input, chunks, 2);
                    setActiveSources(relevant);
                    let content = "I detect no relevant semantic patterns for this query in the current document.";
                    if (relevant.length > 0) {
                        content = `Based on the document structure (Page ${relevant[0].pageIndex + 1}): "${relevant[0].text.slice(0, 200)}..." \n\n*Note: Load Local AI for deeper analysis.*`;
                    }
                    setMessages(prev => [...prev, {
                        id: assistantMsgId,
                        role: 'assistant',
                        content,
                        sources: relevant.map(c => ({ page: c.pageIndex + 1, chunk: 0 }))
                    }]);
                    setIsTyping(false);
                }, 800);
            }
        } catch (e) {
            console.error(e);
            toast.error("Interrogation failed");
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="grid grid-cols-12 gap-8 min-h-[700px] animate-in slide-up duration-700">
            {/* PDF Viewer - 7 Columns */}
            <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
                <div className="bg-slate-900/80 rounded-3xl border border-white/5 p-4 min-h-[600px] flex flex-col relative shadow-2xl overflow-hidden group">
                    {!file ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mb-6 border border-violet-500/20">
                                <FileText className="w-8 h-8 text-violet-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Awaiting Intelligence Target</h3>
                            <p className="text-sm text-slate-500 mb-8 max-w-sm">Upload a document to initialize the semantic interrogation engine.</p>
                            <FileUpload
                                onFilesSelected={handleFileSelected}
                                files={[]}
                                accept={{ 'application/pdf': ['.pdf'] }}
                                multiple={false}
                                maxSize={limits.maxFileSize}
                                isPro={isPro}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 relative bg-slate-950/50 rounded-2xl overflow-hidden flex items-start justify-center overflow-y-auto no-scrollbar">
                            <div className="relative shadow-2xl my-8">
                                <PDFPageViewer
                                    file={file}
                                    pageNumber={pageIndex}
                                    scale={1.3}
                                    onPageLoad={() => { }}
                                    highlights={highlights}
                                />
                            </div>

                            <div className="absolute top-4 right-4 flex gap-2">
                                <Button size="sm" variant="secondary" className="bg-slate-900/80 backdrop-blur border-white/5 rounded-full" onClick={() => setFile(null)}>Change Document</Button>
                            </div>

                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/90 py-3 px-6 rounded-full border border-white/10 backdrop-blur-xl shadow-2xl">
                                <button disabled={pageIndex <= 1} onClick={() => setPageIndex(p => p - 1)} className="text-slate-400 hover:text-white disabled:opacity-30">
                                    <Activity className="w-4 h-4 rotate-180" />
                                </button>
                                <div className="text-xs font-black text-white px-4 border-x border-white/10">
                                    <span className="text-violet-400">{pageIndex}</span> / {numPages}
                                </div>
                                <button disabled={pageIndex >= numPages} onClick={() => setPageIndex(p => p + 1)} className="text-slate-400 hover:text-white disabled:opacity-30">
                                    <Activity className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Intelligence Stats */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { icon: ShieldCheck, label: "Privacy", val: "Zero-Knowledge" },
                        { icon: Gauge, label: "Inference", val: isDeepAI ? "WebGPU" : "CPU-Lite" },
                        { icon: Hash, label: "Context", val: `${chunks.length} Chunks` }
                    ].map((s, i) => (
                        <GlassCard key={i} className="p-4 flex items-center gap-4 border-violet-500/10">
                            <s.icon className="w-5 h-5 text-violet-400" />
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{s.label}</p>
                                <p className="text-xs text-white font-bold">{s.val}</p>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>

            {/* Chat Intelligence HUD - 5 Columns */}
            <div className="col-span-12 lg:col-span-5 flex flex-col h-[700px] gap-6">
                <GlassCard className="flex-1 flex flex-col overflow-hidden border-violet-500/20 shadow-2xl shadow-violet-500/5 bg-slate-900/50">
                    <div className="p-5 border-b border-white/5 bg-slate-800/40 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                                <BrainCircuit className="w-4 h-4 text-violet-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-sm">Semantic HUD</h4>
                                <div className="flex items-center gap-1.5">
                                    <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isDeepAI ? "bg-emerald-500" : "bg-orange-500")} />
                                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">
                                        {isDeepAI ? "Engine Active" : "Limited Mode"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {!isDeepAI && gpuStatus?.supported && !isLlmLoading && (
                            <button
                                onClick={initDeepAI}
                                className="group px-4 py-2 bg-violet-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-violet-400 transition-all shadow-lg shadow-violet-500/20"
                            >
                                <Zap className="w-3 h-3 group-hover:scale-125 transition-transform" />
                                Unlock Deep AI
                            </button>
                        )}
                    </div>

                    {isLlmLoading && (
                        <div className="p-6 border-b border-white/5 bg-violet-600/5">
                            <ProgressBar progress={llmProgress} label={llmStatus} />
                            <p className="text-[10px] text-violet-400/60 mt-3 text-center italic">Synchronizing local neural weights (~150MB secure cache)</p>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar fondo-dot">
                        {messages.map((msg) => (
                            <div key={msg.id} className={cn("flex gap-4", msg.role === 'user' ? 'flex-row-reverse' : '')}>
                                <div className={cn(
                                    "w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg",
                                    msg.role === 'user' ? 'bg-violet-600' : 'bg-slate-800 border border-white/5'
                                )}>
                                    {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-violet-400" />}
                                </div>
                                <div className="space-y-3 max-w-[85%]">
                                    <div className={cn(
                                        "rounded-3xl p-4 text-sm leading-relaxed shadow-xl",
                                        msg.role === 'user' ? 'bg-violet-600 text-white' : 'bg-slate-800/80 text-slate-200 border border-white/5 backdrop-blur-sm'
                                    )}>
                                        {msg.content}
                                    </div>

                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {msg.sources.map((src, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleJumpToSource(src.page, "")}
                                                    className="flex items-center gap-1.5 px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-[10px] text-violet-400 hover:bg-violet-500 hover:text-white transition-all font-bold"
                                                >
                                                    <BookOpen className="w-3 h-3" />
                                                    Page {src.page}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex gap-4 animate-pulse">
                                <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-violet-500" />
                                </div>
                                <div className="bg-slate-800/50 rounded-full px-6 py-3 flex gap-1 items-center border border-white/5">
                                    <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-6 bg-slate-800/40 border-t border-white/5">
                        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-3">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={file ? "Interrogate document..." : "Archival required..."}
                                    disabled={!file || isTyping}
                                    className="w-full bg-slate-950 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white outline-none focus:border-violet-500/50 transition-all placeholder:text-slate-600"
                                />
                            </div>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={!file || isTyping || !input.trim()}
                                className="px-8 rounded-2xl bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-600/20"
                            >
                                <Zap className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
