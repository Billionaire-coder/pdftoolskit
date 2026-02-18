/* eslint-disable */
import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';
import { applyBranding } from './core';

export interface OptimizationOptions {
    quality?: number;
    targetSizeBytes?: number;
    scale?: number;
    stripMetadata?: boolean;
    mode?: 'lossless' | 'balanced' | 'extreme';
}

export class OptimizationService {
    /**
     * Entry point for PDF optimization
     */
    static async optimize(file: File, options: OptimizationOptions = {}): Promise<Uint8Array> {
        const { quality = 0.7, targetSizeBytes, stripMetadata = true, mode = 'balanced' } = options;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);

        if (stripMetadata) {
            pdf.setTitle('');
            pdf.setAuthor('');
            pdf.setSubject('');
            pdf.setKeywords([]);
            pdf.setProducer('PDFToolskit Optimization Engine');
            pdf.setCreator('PDFToolskit');
        }

        applyBranding(pdf);

        // 1. Structural Optimization (Object Streams)
        let compressed = await pdf.save({
            useObjectStreams: true,
            addDefaultPage: false,
        });

        // 2. Content-Aware Image Downsampling (The "Deepening")
        if (mode !== 'lossless') {
            try {
                const optimizedPdf = await this.downsampleImages(arrayBuffer, mode === 'extreme' ? 0.5 : 0.75, mode === 'extreme' ? 0.6 : 1.0);
                compressed = optimizedPdf;
            } catch (err) {
                console.warn("Selective downsampling failed, falling back to structural optimization.", err);
            }
        }

        // 3. Binary Search Target Optimization (Only if target size specified)
        if (targetSizeBytes && compressed.length > targetSizeBytes) {
            compressed = await this.runOptimizationLoop(file, targetSizeBytes, quality);
        }

        return compressed;
    }

    /**
     * Selective Image Downsampling
     * Traverses the PDF structure and re-encodes large XObjects
     */
    private static async downsampleImages(buffer: ArrayBuffer, quality: number, scale: number): Promise<Uint8Array> {
        const pdfDoc = await PDFDocument.load(buffer);
        const pages = pdfDoc.getPages();

        for (const page of pages) {
            const { node } = page as any;
            const resources = node.Resources();
            if (!resources) continue;

            const xObjects = resources.get(PDFName.of('XObject'));
            if (!xObjects) continue;

            const xObjectDict = pdfDoc.context.lookup(xObjects);
            if (!(xObjectDict instanceof Map)) continue;

            for (const [name, ref] of (xObjectDict as any).entries()) {
                const xObject = pdfDoc.context.lookup(ref);
                if (!(xObject instanceof PDFRawStream)) continue;

                const subtype = xObject.dict.get(PDFName.of('Subtype'));
                if (subtype !== PDFName.of('Image')) continue;

                const widthObj = xObject.dict.get(PDFName.of('Width'));
                const heightObj = xObject.dict.get(PDFName.of('Height'));
                const width = (widthObj as any)?.asNumber?.();
                const height = (heightObj as any)?.asNumber?.();

                // Only process large images (approx heuristic)
                if (width && height && width * height > 500000) {
                    try {
                        const imageBytes = xObject.contents;
                        // In browser, we use a hidden canvas to re-encode
                        const newBytes = await this.reencodeImage(imageBytes, quality, scale);
                        if (newBytes && newBytes.length < imageBytes.length) {
                            const newImage = await pdfDoc.embedJpg(newBytes);
                            (xObjectDict as any).set(name, (newImage as any).ref);
                        }
                    } catch (e) {
                        console.error("Failed to re-encode XObject:", name, e);
                    }
                }
            }
        }

        return await pdfDoc.save({ useObjectStreams: true });
    }

    private static async reencodeImage(bytes: Uint8Array, quality: number, scale: number): Promise<Uint8Array | null> {
        return new Promise((resolve) => {
            const blob = new Blob([bytes as any]);
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                if (!ctx) return resolve(null);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((resultBlob) => {
                    if (!resultBlob) return resolve(null);
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
                    reader.readAsArrayBuffer(resultBlob);
                }, 'image/jpeg', quality);
                URL.revokeObjectURL(url);
            };
            img.onerror = () => resolve(null);
            img.src = url;
        });
    }

    /**
     * Rasterization Fallback (Legacy/Extreme)
     */
    private static async rasterize(file: File, options: { quality: number; scale: number }): Promise<Uint8Array> {
        const { quality, scale } = options;
        const arrayBuffer = await file.arrayBuffer();
        const pdfjsLib = await import('pdfjs-dist');

        if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        }

        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const newPdf = await PDFDocument.create();

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const context = canvas.getContext('2d');
            if (context) {
                await page.render({ canvasContext: context, viewport }).promise;
                const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
                if (blob) {
                    const imageBytes = await blob.arrayBuffer();
                    const embeddedImage = await newPdf.embedJpg(imageBytes);
                    const newPage = newPdf.addPage([viewport.width / scale, viewport.height / scale]);
                    newPage.drawImage(embeddedImage, { x: 0, y: 0, width: viewport.width / scale, height: viewport.height / scale });
                }
            }
            canvas.width = 0; canvas.height = 0; canvas.remove();
        }

        applyBranding(newPdf);
        const result = await newPdf.save();
        await pdf.destroy();
        return result;
    }

    private static async runOptimizationLoop(file: File, targetSize: number, initialQuality: number): Promise<Uint8Array> {
        let currentScale = 1.5;
        let currentQuality = initialQuality;
        let bestResult: Uint8Array | null = null;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            attempts++;
            const result = await this.rasterize(file, { quality: currentQuality, scale: currentScale });
            if (!bestResult || result.length < bestResult.length) bestResult = result;
            if (result.length <= targetSize) return result;
            currentQuality -= 0.15;
            currentScale -= 0.2;
            if (currentQuality < 0.1 || currentScale < 0.3) break;
        }

        return bestResult || new Uint8Array();
    }
}
