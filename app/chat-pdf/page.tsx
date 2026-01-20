
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, User, Bot, FileText, Settings } from 'lucide-react';
import { FileUpload } from '@/components/shared/FileUpload';
import { PDFPageViewer } from '@/components/pdf/PDFPageViewer';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { extractTextFromPDF, TextItemWithCoords } from '@/lib/pdf-text-extractor';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import toast from 'react-hot-toast';
import { getMLCEngine, checkWebGPU, SELECTED_MODEL, FALLBACK_MODEL } from '@/lib/web-llm';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { ShieldCheck, Cpu, AlertTriangle, Zap } from 'lucide-react';
import { AdSense } from '@/components/shared/AdSense';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: number[]; // Page numbers
}

export default function ChatPDFPage() {
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
            toast.error("WebGPU is not supported in this browser. Deep AI requires a modern browser (Chrome/Edge/Safari) with Hardware Acceleration enabled.");
            return;
        }

        setIsLlmLoading(true);
        try {
            const hasF16 = gpuStatus.hasF16;
            const modelId = hasF16 ? SELECTED_MODEL : FALLBACK_MODEL;

            if (!hasF16) {
                toast.loading("f16 support not detected. Using compatibility model (TinyLlama)...", { id: 'model-status', duration: 3000 });
            }

            const engine = await getMLCEngine((report) => {
                setLlmProgress(Math.floor(report.progress * 100));
                setLlmStatus(report.text);
            }, modelId);

            setIsLlmReady(true);
            setIsDeepAI(true);
            toast.success(`Deep AI Engine Loaded (${hasF16 ? 'Phi-3' : 'TinyLlama'})!`);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load local AI model. Please check if your GPU drivers are up to date.");
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

                // Group by page for easy searching
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
                const firstPageSnippet = pdfText[0].text.substring(0, 300);
                aiContent = `### Document Summary\nThis document has **${numPages} pages** and approximately **${totalWords} words**.\n\n**Key Highlights:**\n1. Based on the initial sections, it discusses: *${firstPageSnippet.split('.')[0]}*.\n2. Total length and structure suggest it is a ${numPages > 10 ? 'lengthy report' : 'short document'}.\n3. [Draft] This is a local-only summary generated by analyzing text structure.`;
            } else if (action === 'redact') {
                // Basic PII Scanner (Regex)
                const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
                const phoneRegex = /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;

                const foundEmails: string[] = [];
                const foundPhones: string[] = [];
                const newHighlights: any[] = [];

                pdfText.forEach(p => {
                    let match;
                    while ((match = emailRegex.exec(p.text)) !== null) {
                        foundEmails.push(match[0]);
                    }
                    while ((match = phoneRegex.exec(p.text)) !== null) {
                        foundPhones.push(match[0]);
                    }
                });

                // Match with fullTextData to get rects
                const piiItems = fullTextData.filter(item =>
                    foundEmails.some(e => item.str.includes(e)) ||
                    foundPhones.some(ph => item.str.includes(ph))
                );

                const rects = piiItems.map(item => ({
                    x: item.x,
                    y: item.y,
                    width: item.width,
                    height: item.height,
                    color: 'rgba(239, 68, 68, 0.4)' // Red for PII
                }));

                setHighlights(rects);
                aiContent = `### Privacy Scan Complete 🛡️\nI found **${foundEmails.length} emails** and **${foundPhones.length} phone numbers** in this document.\n\nI have highlighted them in **red** for you. You can use our **[Redact PDF](/redact-pdf)** tool to permanently remove them before sharing.`;
                if (rects.length > 0) setPageIndex(piiItems[0].pageIndex + 1);
            } else if (action === 'extract') {
                // Heuristic Table/List Extractor
                const lines = pdfText.map(p => p.text.split('\n')).flat();
                const tableRows = lines.filter(line => (line.match(/\d+/g) || []).length > 2); // Lines with 3+ numbers are likely data

                if (tableRows.length > 0) {
                    const csv = tableRows.map(row => row.replace(/\s+/g, ',')).join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);

                    aiContent = `### Data Extraction Complete 📊\nI detected **${tableRows.length} potential data rows** in your document.\n\nI have generated a CSV file for you to download.\n\n[**Download Extracted Data (CSV)**](${url})`;
                } else {
                    aiContent = `### Data Extraction Results\nI couldn't find obvious tabular data or structured lists in this document. \n\nTip: Clear tables with headers and numerical columns work best for extraction.`;
                }
            }

            const newMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: aiContent
            };

            setMessages(prev => [...prev, newMessage]);
            setIsTyping(false);
        }, 1500);
    };

    const handleSendMessage = async () => {
        if (!input.trim() || !file) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);
        setHighlights([]); // Clear previous highlights on new question

        // Hybrid RAG Logic
        const query = userMsg.content.toLowerCase();
        const relevantPages: { page: number, score: number, snippet: string, rects: any[] }[] = [];
        const keywords = query.split(' ').filter(w => w.length > 3);

        pdfText.forEach(p => {
            let score = 0;
            const lowerText = p.text.toLowerCase();
            keywords.forEach(k => {
                if (lowerText.includes(k)) score += 1;
            });

            if (score > 0) {
                let snippet = '';
                const firstKey = keywords.find(k => lowerText.includes(k));
                if (firstKey) {
                    const idx = lowerText.indexOf(firstKey);
                    const start = Math.max(0, idx - 50);
                    const end = Math.min(p.text.length, idx + 150);
                    snippet = p.text.substring(start, end);
                }

                const pageItems = fullTextData.filter(item => item.pageIndex === p.page - 1);
                const matchingItems = pageItems.filter(item =>
                    keywords.some(k => item.str.toLowerCase().includes(k))
                );

                const rects = matchingItems.map(item => ({
                    x: item.x,
                    y: item.y,
                    width: item.width,
                    height: item.height,
                    color: 'rgba(250, 204, 21, 0.4)'
                }));

                relevantPages.push({ page: p.page, score, snippet, rects });
            }
        });

        relevantPages.sort((a, b) => b.score - a.score);

        if (isDeepAI && isLlmReady) {
            try {
                const context = relevantPages.slice(0, 3).map(p => `[Page ${p.page}]: ${p.snippet}`).join('\n---\n');
                const engine = await getMLCEngine();

                const prompt = `Use the following context from a PDF document to answer the user's question. If the information is not in the context, say you don't know based on the document.
                
                CONTEXT:
                ${context || "No direct text matches found, please try your best based on general document metadata."}
                
                USER QUESTION: ${userMsg.content}`;

                const response = await engine.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    stream: false
                });

                const aiContent = response.choices[0].message.content || "I couldn't generate an answer.";
                const sources = relevantPages.slice(0, 3).map(p => p.page);

                const newMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: aiContent,
                    sources: sources
                };

                if (relevantPages.length > 0) {
                    setPageIndex(relevantPages[0].page);
                    setHighlights(relevantPages[0].rects);
                    (newMessage as any).sourceRects = relevantPages.reduce((acc, curr) => {
                        acc[curr.page] = curr.rects;
                        return acc;
                    }, {} as Record<number, any[]>);
                }

                setMessages(prev => [...prev, newMessage]);
            } catch (error) {
                console.error(error);
                toast.error("Deep AI Inference failed.");
            } finally {
                setIsTyping(false);
            }
        } else {
            // Original Simple AI (Fallback)
            setTimeout(() => {
                let aiContent = '';
                let sources: number[] = [];

                if (relevantPages.length > 0) {
                    const topMatch = relevantPages[0];
                    aiContent = `I found relevant information on **Page ${topMatch.page}**:\n\n> "${topMatch.snippet}"\n\nIs there anything specific you'd like to know? (Enable 'Deep AI' for human-like reasoning)`;
                    sources = relevantPages.slice(0, 3).map(p => p.page);
                } else {
                    aiContent = "I couldn't find a direct match in the document for that. Could you try rephrasing with specific keywords from the file?";
                }

                const newMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: aiContent,
                    sources: sources
                };

                if (relevantPages.length > 0) {
                    setPageIndex(relevantPages[0].page);
                    setHighlights(relevantPages[0].rects);
                    (newMessage as any).sourceRects = relevantPages.reduce((acc, curr) => {
                        acc[curr.page] = curr.rects;
                        return acc;
                    }, {} as Record<number, any[]>);
                }

                setMessages(prev => [...prev, newMessage]);
                setIsTyping(false);
            }, 1000);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-[1600px]">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold gradient-text mb-2">Chat with PDF</h1>
                <p className="text-slate-400">Ask questions and get instant answers from your document</p>
            </div>

            <div className="grid grid-cols-12 gap-6 min-h-[calc(100vh-200px)]">

                {/* Left: PDF Viewer (or Upload) */}
                <div className="col-span-12 lg:col-span-7 bg-slate-900/50 rounded-2xl border border-slate-700 p-4 min-h-[500px] flex flex-col relative">
                    {!file ? (
                        <div className="flex-1 flex items-center justify-center p-8">
                            <FileUpload
                                onFilesSelected={handleFileSelected}
                                files={file ? [file] : []}
                                accept={{ 'application/pdf': ['.pdf'] }}
                                multiple={false}
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

                            {/* Page Controls Overlay */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-slate-900/80 p-2 rounded-full backdrop-blur">
                                <Button size="sm" variant="ghost" disabled={pageIndex <= 1} onClick={() => setPageIndex(p => p - 1)}>Prev</Button>
                                <span className="text-white text-sm flex items-center px-2">{pageIndex} / {numPages || '?'}</span>
                                <Button size="sm" variant="ghost" disabled={pageIndex >= numPages} onClick={() => setPageIndex(p => p + 1)}>Next</Button>
                            </div>

                            <Button
                                size="sm"
                                variant="ghost"
                                className="absolute top-4 right-4 bg-slate-900/50 hover:bg-slate-900"
                                onClick={() => setFile(null)}
                            >
                                Change File
                            </Button>
                        </div>
                    )}
                </div>

                {/* Right: Chat Interface */}
                <div className="col-span-12 lg:col-span-5 flex flex-col h-[600px] lg:h-auto">
                    <GlassCard className="flex-1 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Bot className="w-5 h-5 text-blue-400" />
                                <div className="flex flex-col">
                                    <span className="font-semibold text-white leading-tight">AI Assistant</span>
                                    {isDeepAI && (
                                        <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                            <Zap className="w-2.5 h-2.5" /> Deep Mode
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {!isLlmReady && !isLlmLoading && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-[10px] h-8 px-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30 hover:shadow-glow-sm"
                                        onClick={initDeepAI}
                                        disabled={!gpuStatus?.supported}
                                        icon={<Cpu className="w-3 h-3" />}
                                    >
                                        Enable Deep AI
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs h-8 px-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20"
                                    onClick={() => handleAIAction('summary')}
                                    disabled={!file}
                                >
                                    Summarize
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs h-8 px-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                                    onClick={() => handleAIAction('redact')}
                                    disabled={!file}
                                >
                                    Scan Privacy
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs h-8 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                                    onClick={() => handleAIAction('extract')}
                                    disabled={!file}
                                >
                                    Extract Data
                                </Button>
                                <Button variant="ghost" size="sm" icon={<Settings className="w-4 h-4" />} />
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
                            {isLlmLoading && (
                                <div className="absolute inset-x-4 top-4 z-20 animate-in fade-in slide-in-from-top-4">
                                    <GlassCard className="p-4 bg-indigo-900/40 border-indigo-500/30 backdrop-blur-xl">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 rounded-lg bg-indigo-500/20">
                                                <Cpu className="w-5 h-5 text-indigo-400 animate-pulse" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">Downloading Local Model...</h4>
                                                <p className="text-[10px] text-slate-300">This happens once. Model is saved in browser cache.</p>
                                            </div>
                                        </div>
                                        <ProgressBar progress={llmProgress} label={llmStatus || "Initializing WebGPU..."} />
                                    </GlassCard>
                                </div>
                            )}

                            {gpuStatus?.supported === false && (
                                <div className="p-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3 items-start">
                                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-200/80 leading-relaxed">
                                        <strong>WebGPU not detected.</strong> Deep AI is disabled, but you can still use our fast Keyword Search. Try Chrome or Edge for the full experience.
                                    </p>
                                </div>
                            )}

                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-green-600'}`}>
                                        {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                                    </div>
                                    <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-sm'
                                        : 'bg-slate-700 text-slate-200 rounded-tl-sm'
                                        }`}>
                                        <div className="whitespace-pre-wrap">{msg.content}</div>
                                        {msg.sources && msg.sources.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-white/10 flex gap-2">
                                                <span className="text-xs opacity-70">Sources:</span>
                                                {msg.sources.map(p => (
                                                    <button
                                                        key={p}
                                                        onClick={() => {
                                                            setPageIndex(p);
                                                            // Highlight if we have data
                                                            if ((msg as any).sourceRects && (msg as any).sourceRects[p]) {
                                                                setHighlights((msg as any).sourceRects[p]);
                                                            }
                                                        }}
                                                        className="text-xs bg-white/10 hover:bg-white/20 px-1.5 rounded transition-colors"
                                                    >
                                                        Page {p}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="bg-slate-700 rounded-2xl p-3 rounded-tl-sm flex gap-1 items-center">
                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75" />
                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-slate-800/50 border-t border-slate-700">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                                className="flex gap-2"
                            >
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={file ? "Ask a question..." : "Upload a PDF first"}
                                    disabled={!file || isTyping}
                                    className="flex-1 bg-slate-900 border border-slate-600 rounded-full px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-50"
                                />
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={!file || isTyping || !input.trim()}
                                    className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
                                >
                                    <Send className="w-5 h-5" />
                                </Button>
                            </form>
                        </div>
                        <div className="px-4 py-2 border-t border-slate-700/50 bg-slate-900/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-[10px] text-slate-400">100% Local Inference • No Data Uploaded</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-slate-500">Engine: {isDeepAI ? 'WebLLM (Llama/Phi)' : 'Keyword-Search'}</span>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>

            <div className="mt-8">
                <AdSense slot="chat-pdf-bottom" />
            </div>

            <div className="mt-12">
                <ToolContent toolName="/chat-pdf" />
                <RelatedTools currentToolHref="/chat-pdf" />
            </div>
        </div>
    );
}
