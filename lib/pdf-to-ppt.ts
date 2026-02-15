import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

/**
 * Convert PDF to PowerPoint (PPTX)
 * Renders each page as an image and adds it to a slide
 * This ensures perfect visual fidelity.
 */
export async function pdfToPowerPoint(file: File): Promise<Uint8Array> {
    const PptxGenJS = (await import('pptxgenjs')).default;

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;

    const pptx = new PptxGenJS();
    // 16:9 Aspect Ratio by default
    pptx.layout = 'LAYOUT_16x9';

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for quality

        // Create canvas to render page
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');

        if (!context) continue;

        await page.render({
            canvasContext: context,
            viewport: viewport,
        }).promise;

        const imgData = canvas.toDataURL('image/jpeg', 0.8);

        // Create slide
        const slide = pptx.addSlide();

        // Add image to slide (stretch to fill)
        slide.addImage({
            data: imgData,
            x: 0,
            y: 0,
            w: '100%',
            h: '100%',
        });
    }

    // Generate PPTX

    const blob = await pptx.write({ outputType: 'blob' });
    return new Uint8Array(await (blob as Blob).arrayBuffer());
}
