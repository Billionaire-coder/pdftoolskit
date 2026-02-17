/* eslint-disable no-restricted-globals */
/// <reference lib="dom" />
/// <reference lib="webworker" />
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// No global canvas to avoid race conditions between renders

self.onmessage = async (e: MessageEvent) => {
    const { type, file, pageNumber, scale, url } = e.data;

    if (type === 'RENDER_THUMBNAIL') {
        try {
            // Use URL if provided (preferred)
            let loadingTask;
            if (file) {
                const arrayBuffer = await file.arrayBuffer();
                loadingTask = pdfjsLib.getDocument({
                    data: arrayBuffer,
                    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
                    cMapPacked: true,
                    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`
                });
            } else if (url) {
                loadingTask = pdfjsLib.getDocument({
                    url,
                    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
                    cMapPacked: true,
                    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`
                });
            } else {
                throw new Error('No file or URL provided');
            }

            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(pageNumber);

            const viewport = page.getViewport({ scale });

            if (typeof OffscreenCanvas === 'undefined') {
                throw new Error('OffscreenCanvas is not supported');
            }

            // Create a fresh canvas for every render to avoid "Same Canvas" conflicts
            const canvas = new OffscreenCanvas(viewport.width, viewport.height);
            const context = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;

            if (!context) {
                throw new Error('Failed to get 2D context');
            }

            await page.render({
                canvasContext: context as any,
                viewport,
            }).promise;

            // Convert to ImageBitmap to transfer
            const bitmap = canvas.transferToImageBitmap();

            // Clean up
            if (pdf.cleanup) await pdf.cleanup();
            if (pdf.destroy) await pdf.destroy();

            (self as unknown as DedicatedWorkerGlobalScope).postMessage(
                { type: 'THUMBNAIL_SUCCESS', bitmap, pageNumber },
                [bitmap] // Transfer the bitmap
            );

        } catch (error: any) {
            console.error('Worker Error:', error);
            self.postMessage({ type: 'ERROR', message: error.message });
        }
    }
};
