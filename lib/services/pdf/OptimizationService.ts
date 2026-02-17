/* eslint-disable */
import { PDFDocument } from 'pdf-lib';
import { applyBranding } from './core';

export interface OptimizationOptions {
    quality?: number;
    targetSizeBytes?: number;
    scale?: number;
    stripMetadata?: boolean;
}

export class OptimizationService {
    /**
     * Entry point for PDF optimization
     */
    static async optimize(file: File, options: OptimizationOptions = {}): Promise<Uint8Array> {
        const { quality = 0.7, targetSizeBytes, stripMetadata = true } = options;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);

        if (stripMetadata) {
            pdf.setTitle('');
            pdf.setAuthor('');
            pdf.setSubject('');
            pdf.setKeywords([]);
        }

        applyBranding(pdf);

        let compressed = await pdf.save({
            useObjectStreams: true,
            addDefaultPage: false,
            objectsPerTick: 50,
        });

        const reductionRatio = (file.size - compressed.length) / file.size;

        // If standard compression didn't help much, and we're aiming for quality/size, try rasterization
        if (!targetSizeBytes && reductionRatio < 0.05) {
            if (quality <= 0.5) {
                compressed = await this.rasterize(file, { quality: 0.5, scale: 1.0 });
            } else if (quality <= 0.75) {
                compressed = await this.rasterize(file, { quality: 0.7, scale: 1.5 });
            }
        }

        // If target size is specified, enter the optimization loop
        if (targetSizeBytes && compressed.length > targetSizeBytes) {
            compressed = await this.runOptimizationLoop(file, targetSizeBytes, quality);
        }

        return compressed;
    }

    /**
     * Aggressively compress by rasterizing pages
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
            if (!context) throw new Error('Failed to create canvas context');

            await page.render({ canvasContext: context, viewport }).promise;

            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
            if (!blob) continue;

            const imageBytes = await blob.arrayBuffer();
            const embeddedImage = await newPdf.embedJpg(imageBytes);

            const newPage = newPdf.addPage([viewport.width / scale, viewport.height / scale]);
            newPage.drawImage(embeddedImage, {
                x: 0,
                y: 0,
                width: viewport.width / scale,
                height: viewport.height / scale,
            });

            // Cleanup
            canvas.width = 0;
            canvas.height = 0;
            canvas.remove();
            (page as any).cleanup();
        }

        applyBranding(newPdf);
        const result = await newPdf.save();
        await pdf.destroy();
        return result;
    }

    /**
     * Binary-ish search for the best quality/scale to hit target size
     */
    private static async runOptimizationLoop(file: File, targetSize: number, initialQuality: number): Promise<Uint8Array> {
        let currentScale = 1.5;
        let currentQuality = initialQuality;
        let bestResult: Uint8Array | null = null;
        let attempts = 0;
        const maxAttempts = 5;

        // Fast estimation
        const gapRatio = file.size / targetSize;
        if (gapRatio > 5) { currentScale = 0.8; currentQuality = 0.4; }
        else if (gapRatio > 3) { currentScale = 1.0; currentQuality = 0.5; }
        else if (gapRatio > 2) { currentScale = 1.2; currentQuality = 0.6; }

        while (attempts < maxAttempts) {
            attempts++;
            const result = await this.rasterize(file, { quality: currentQuality, scale: currentScale });

            if (!bestResult || result.length < bestResult.length) {
                bestResult = result;
            }

            if (result.length <= targetSize) return result;

            // Reduce parameters for next attempt
            currentQuality -= 0.15;
            currentScale -= 0.2;

            if (currentQuality < 0.1 || currentScale < 0.3) break;
        }

        return bestResult || new Uint8Array();
    }
}
