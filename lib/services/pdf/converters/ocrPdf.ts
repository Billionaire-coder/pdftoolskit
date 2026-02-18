import { createScheduler, createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

export interface OcrOptions {
    languages: string[];
    adaptiveThreshold: boolean;
    onProgress?: (progress: { page: number, total: number, workerId: number }) => void;
}

// Pre-processing filter: Adaptive Thresholding
function preprocessImage(canvas: HTMLCanvasElement, adaptive: boolean): HTMLCanvasElement {
    if (!adaptive) return canvas;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return canvas;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Adaptive Thresholding logic (Otsu's simplified)
    // We calculate the mean luminance and use it as a threshold
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
        const luminance = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        sum += luminance;
    }
    const mean = sum / (data.length / 4);
    const threshold = mean * 0.95; // Slightly lower than mean to pick up text better

    for (let i = 0; i < data.length; i += 4) {
        const luminance = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        const val = luminance > threshold ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = val;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

export async function* ocrPdfGenerator(
    file: File,
    options: OcrOptions
): AsyncGenerator<{ page: number, text: string, pdfPage?: Uint8Array }> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdfDoc.numPages;

    // Initialize Scheduler and Pool
    const scheduler = createScheduler();
    const numWorkers = Math.min(4, navigator.hardwareConcurrency || 2);
    const workers = await Promise.all(
        Array.from({ length: numWorkers }).map(async () => {
            const worker = await createWorker(options.languages.join('+'));
            scheduler.addWorker(worker);
            return worker;
        })
    );

    try {
        // Process pages in chunks to balance memory and speed
        for (let i = 1; i <= numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context!, viewport }).promise;

            // Apply Vision Filter
            const processedCanvas = preprocessImage(canvas, options.adaptiveThreshold);

            // Perform OCR
            const { data: { text, pdf } } = await (scheduler.addJob('recognize', processedCanvas, { pdfTitle: `Page ${i}` }) as any);

            yield {
                page: i,
                text,
                pdfPage: new Uint8Array(pdf as any)
            };

            // Memory Cleanup
            canvas.width = 0;
            canvas.height = 0;
            if (options.onProgress) options.onProgress({ page: i, total: numPages, workerId: 0 });
        }
    } finally {
        await scheduler.terminate();
    }
}

export async function ocrPdfFull(file: File, options: OcrOptions): Promise<Uint8Array> {
    const generator = ocrPdfGenerator(file, options);
    const mergedPdf = await PDFDocument.create();

    for await (const result of generator) {
        if (result.pdfPage) {
            const pagePdf = await PDFDocument.load(result.pdfPage);
            const [copiedPage] = await mergedPdf.copyPages(pagePdf, [0]);
            mergedPdf.addPage(copiedPage);
        }
    }

    return await mergedPdf.save();
}
