'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FileText, Download, Copy, RefreshCw, FileImage } from 'lucide-react';
import toast from 'react-hot-toast';
import { PDFDocument } from 'pdf-lib';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { downloadFile, validatePDFFile } from '@/lib/utils'; // Reusing validatePDFFile but we also accept images
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { ToolHeader } from '@/components/shared/ToolHeader';
import { FeatureGate } from '@/components/shared/FeatureGate';

export default function OCRPDFPage() {
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [extractedText, setExtractedText] = useState('');
    const [searchablePdfBytes, setSearchablePdfBytes] = useState<Uint8Array | null>(null);
    const [status, setStatus] = useState('Ready');
    const [downloadFileName, setDownloadFileName] = useState('');

    useEffect(() => {
        if (file) {
            setDownloadFileName(file.name.split('.')[0]);
        }
    }, [file]);

    const handleFileSelected = (files: File[]) => {
        const selectedFile = files[0];
        // Allow PDF and Images
        if (selectedFile.type === 'application/pdf' || selectedFile.type.startsWith('image/')) {
            setFile(selectedFile);
            setExtractedText('');
            setStatus('Ready');
            toast.success('File uploaded successfully');
        } else {
            toast.error('Please upload a PDF or Image file');
        }
    };

    const preprocessImage = async (blob: Blob): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                // Upscale for better recognition
                const scale = 2.5;
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;

                if (ctx) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;

                    // Preprocessing: Grayscale + High Contrast Binarization
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];

                        // Luminance formula
                        const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;

                        // Adaptive-like thresholding strategy for colored backgrounds
                        // If it's a light background (mind map bubbles), we want to make it white?
                        // If text is black, gray will be low.
                        // If background is light green/blue, gray will be high.

                        // Simple threshold
                        const val = gray > 130 ? 255 : 0;

                        data[i] = val;
                        data[i + 1] = val;
                        data[i + 2] = val;
                    }
                    ctx.putImageData(imageData, 0, 0);
                }
                resolve(canvas.toDataURL('image/jpeg', 0.9));
            };
            img.src = URL.createObjectURL(blob);
        });
    };

    const handleOCR = async () => {
        if (!file) return;

        setProcessing(true);
        setProgress(0);
        setExtractedText('');

        try {
            console.log('Starting OCR process...');
            setStatus('Initializing OCR engine...');

            // Initialize Tesseract Worker
            const { createWorker } = await import('tesseract.js');
            const worker = await createWorker('eng');

            let imagesToProcess: (string | Blob)[] = [];

            if (file.type === 'application/pdf') {
                setStatus('Converting PDF pages to images...');

                // Dynamic import for pdfjs-dist
                const pdfjsLib = await import('pdfjs-dist');
                // Use CDN to ensure version compatibility
                const workerSrc = '/pdf.worker.min.mjs';
                pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

                const numPages = pdf.numPages;
                const progressPerStep = 50 / numPages; // Allocation for PDF conversion

                for (let i = 1; i <= numPages; i++) {
                    setStatus(`Processing PDF page ${i}/${numPages}...`);

                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR

                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    if (context) {
                        await page.render({ canvasContext: context, viewport }).promise;

                        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
                        if (blob) imagesToProcess.push(blob);
                    }

                    setProgress(prev => Math.min(prev + progressPerStep, 50));
                }
            } else {
                // If it's an image, just use it directly
                imagesToProcess = [file];
                setProgress(50);
            }

            setStatus('Recognizing text & Generating PDF...');
            let fullText = '';
            const pagePdfs: Uint8Array[] = [];
            const totalImages = imagesToProcess.length;
            const progressPerImage = 50 / totalImages;

            for (let i = 0; i < totalImages; i++) {
                setStatus(`Recognizing page ${i + 1}/${totalImages}...`);

                // Preprocess image
                const processedImgUrl = await preprocessImage(imagesToProcess[i] as Blob);

                // Recognize text & Generate PDF (Tesseract v6+ API)
                // Using psm 3 (Auto) or 6 (Block) or 11 (Sparse)
                // For Mind Maps, let's try 3 (Default) on the High Contrast image.
                const { data: { text, pdf } } = await worker.recognize(processedImgUrl, {}, { pdf: true });

                fullText += `--- Page ${i + 1} ---\n\n${text}\n\n`;

                if (pdf) {
                    pagePdfs.push(new Uint8Array(pdf));
                }

                setProgress(prev => Math.min(prev + progressPerImage, 99));
            }

            setExtractedText(fullText);

            // Merge PDFs if we have them
            if (pagePdfs.length > 0) {
                setStatus('Merging into Searchable PDF...');
                const mergedPdf = await PDFDocument.create();
                for (const pageBytes of pagePdfs) {
                    const pageDoc = await PDFDocument.load(pageBytes);
                    const copiedPages = await mergedPdf.copyPages(pageDoc, pageDoc.getPageIndices());
                    copiedPages.forEach((page) => mergedPdf.addPage(page));
                }
                const finalPdfBytes = await mergedPdf.save();
                setSearchablePdfBytes(finalPdfBytes);
            }

            await worker.terminate();

            setProgress(100);
            setStatus('Completed!');
            toast.success('Text extracted successfully!');

        } catch (error) {
            console.error('OCR Error:', error);
            toast.error('Failed to extract text. ' + (error instanceof Error ? error.message : ''));
            setStatus('Error occurred');
        } finally {
            setProcessing(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(extractedText);
        toast.success('Copied to clipboard');
    };

    const downloadText = () => {
        const blob = new Blob([extractedText as any], { type: 'text/plain' });
        const finalName = downloadFileName ? `${downloadFileName}_extracted.txt` : 'ocr_result.txt';
        downloadFile(blob, finalName);
    };

    const downloadSearchablePDF = () => {
        if (!searchablePdfBytes) return;
        const blob = new Blob([searchablePdfBytes as any], { type: 'application/pdf' });
        const finalName = downloadFileName ? `${downloadFileName}_searchable.pdf` : 'ocr_result.pdf';
        downloadFile(blob, finalName);
    };

    return (
        <FeatureGate featureName="OCR Text Extraction" blurEffect={true} className="py-12 lg:py-20">
            <div className="container mx-auto px-4 max-w-4xl">
                <ToolHeader
                    toolId="ocrPdf"
                    title="OCR PDF"
                    description="Extract text from scanned PDFs and Images using AI"
                    icon={FileText}
                    color="from-teal-400 to-emerald-500"
                />

                <div className="mb-8">
                    <FileUpload
                        onFilesSelected={handleFileSelected}
                        files={file ? [file] : []}
                        onRemoveFile={() => {
                            setFile(null);
                            setExtractedText('');
                        }}
                        accept={{
                            'application/pdf': ['.pdf'],
                            'image/*': ['.png', '.jpg', '.jpeg', '.bmp']
                        }}
                        multiple={false}
                        maxSize={limits.maxFileSize}
                        isPro={isPro}
                    />
                </div>

                {processing && (
                    <div className="mb-8">
                        <ProgressBar progress={progress} label={status} />
                    </div>
                )}

                {file && !extractedText && !processing && (
                    <GlassCard className="p-6 mb-8 text-center">
                        <p className="text-white mb-4">Ready to extract text from <strong>{file.name}</strong></p>
                        <p className="text-sm text-slate-400 mb-6">Process may take a while for large documents</p>
                        <Button
                            variant="primary"
                            onClick={handleOCR}
                            icon={<RefreshCw className="w-5 h-5" />}
                        >
                            Start OCR Extraction
                        </Button>
                    </GlassCard>
                )}

                {extractedText && (
                    <div className="space-y-6">
                        <GlassCard className="p-6">
                            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                                <h3 className="text-xl font-bold text-white">Extracted Text</h3>
                                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                                    <input
                                        type="text"
                                        value={downloadFileName}
                                        onChange={(e) => setDownloadFileName(e.target.value)}
                                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-400 w-full sm:w-48"
                                        placeholder="Filename prefix"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={copyToClipboard}
                                            icon={<Copy className="w-4 h-4" />}
                                        >
                                            Copy
                                        </Button>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={downloadText}
                                            icon={<Download className="w-4 h-4" />}
                                        >
                                            Save .txt
                                        </Button>
                                        {searchablePdfBytes && (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={downloadSearchablePDF}
                                                icon={<FileText className="w-4 h-4" />}
                                                className="bg-emerald-600 hover:bg-emerald-700"
                                            >
                                                Save .pdf
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-4 max-h-[500px] overflow-y-auto font-mono text-sm text-slate-300 whitespace-pre-wrap border border-slate-700">
                                {extractedText}
                            </div>
                        </GlassCard>
                    </div>
                )}
                <QuickGuide steps={toolGuides['/ocr-pdf']} />
                <ToolContent toolName="/ocr-pdf" />
                <RelatedTools currentToolHref="/ocr-pdf" />
            </div>
        </FeatureGate>
    );
}
