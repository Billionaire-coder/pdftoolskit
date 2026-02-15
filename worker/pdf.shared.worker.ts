/* eslint-disable no-restricted-globals */
/// <reference lib="dom" />
/// <reference lib="webworker" />
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * Shared Worker for PDF Processing
 * Allows multiple tabs to share the same worker context.
 */
// No global canvas to avoid race conditions between renderers

(self as unknown as SharedWorkerGlobalScope).onconnect = (e: MessageEvent) => {
    const port = e.ports[0];

    port.onmessage = async (msgEvent: MessageEvent) => {
        const { type, file, pageNumber, scale, url } = msgEvent.data;

        if (type === 'RENDER_THUMBNAIL') {
            try {
                // Use URL if provided (preferred for streaming), otherwise legacy file buffer
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

                // Clean up PDF document to release memory
                // Note: getDocument().promise returns a PDFDocumentProxy which has destroy/cleanup methods
                // but usually just letting it go out of scope is fine for single page renders unless we keep the doc open.
                // However, pdf.cleanup() or pdf.destroy() is good practice if available in this version.
                if (pdf.cleanup) await pdf.cleanup();
                if (pdf.destroy) await pdf.destroy();

                port.postMessage(
                    { type: 'THUMBNAIL_SUCCESS', bitmap, pageNumber },
                    [bitmap]
                );

            } catch (error: any) {
                console.error('Worker Error:', error);
                port.postMessage({ type: 'ERROR', message: error.message });
            }
        }
    };

    port.start();
};
