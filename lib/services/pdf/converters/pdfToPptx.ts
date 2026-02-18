/* eslint-disable */
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export interface PptxOptions {
    mode: 'editable' | 'raster';
    quality?: number;
}

export class PptxService {
    /**
     * Converts PDF to PowerPoint with Hybrid Reconstruction
     */
    static async convert(file: File, options: PptxOptions = { mode: 'editable' }): Promise<Uint8Array> {
        const PptxGenJS = (await import('pptxgenjs')).default;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pptx = new PptxGenJS();

        // Target 16:9 as default, but we will override per slide if needed (pptxgenjs limitation: global layout)
        // However, we can use defineLayout for custom sizing
        const firstPage = await pdf.getPage(1);
        const firstViewport = firstPage.getViewport({ scale: 1 });

        // Define custom layout based on PDF dimensions (points to inches, 72 DPI)
        const layoutName = 'PDF_MATCH';
        pptx.defineLayout({
            name: layoutName,
            width: firstViewport.width / 72,
            height: firstViewport.height / 72
        });
        pptx.layout = layoutName;

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 }); // High-res for raster fallback
            const slide = pptx.addSlide();

            if (options.mode === 'raster') {
                // Legacy Raster Mode
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    await page.render({ canvasContext: ctx, viewport }).promise;
                    slide.addImage({
                        data: canvas.toDataURL('image/jpeg', 0.85),
                        x: 0, y: 0, w: '100%', h: '100%'
                    });
                }
            } else {
                // Hybrid Editable Mode
                // 1. Render Background (Raster without text for fidelity, or full raster)
                // For better editability, we render the page as a background, but ideally we'd extract text.
                // pptxgenjs doesn't support Z-index easily for text over image background without manual placement.

                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    await page.render({ canvasContext: ctx, viewport }).promise;
                    slide.addImage({
                        data: canvas.toDataURL('image/jpeg', 0.8),
                        x: 0, y: 0, w: '100%', h: '100%'
                    });
                }

                // 2. Overlay Editable Text
                const textContent = await page.getTextContent();
                const { width, height } = page.getViewport({ scale: 1 });

                textContent.items.forEach((item: any) => {
                    if (!item.str.trim()) return;

                    // pdfbox uses a transform matrix [a, b, c, d, tx, ty]
                    // item.transform[4] is X, item.transform[5] is Y (bottom-up in PDF)
                    const x = item.transform[4];
                    const y = height - item.transform[5] - (item.height || 10);

                    // Convert points to inches for pptxgenjs
                    slide.addText(item.str, {
                        x: x / 72,
                        y: y / 72,
                        w: item.width ? item.width / 72 : undefined,
                        h: item.height ? item.height / 72 : 0.3,
                        fontSize: (item.transform[0] || 10), // Approx font size from matrix scale
                        color: '333333', // Default, we could extract color from operatorList in future
                    });
                });
            }
        }

        const blob = await pptx.write({ outputType: 'blob' });
        return new Uint8Array(await (blob as Blob).arrayBuffer());
    }
}
