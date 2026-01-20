import * as pdfjsLib from 'pdfjs-dist';

// Ensure worker is configured (should be handled in global init, but good to ensure)
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    const workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
}

export interface TextItemWithCoords {
    str: string;
    x: number;
    y: number;
    width: number;
    height: number;
    pageIndex: number; // 0-based
    fontName: string;
    fontSize: number;
}

export async function extractTextFromPDF(file: File): Promise<TextItemWithCoords[]> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    const allTextItems: TextItemWithCoords[] = [];

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 }); // Use scale 1.0 for standardized coords
        const textContent = await page.getTextContent();

        for (const item of textContent.items) {
            if ('str' in item) {
                // Convert PDF coords to Viewport coords
                // transform is [scaleX, skewY, skewX, scaleY, tx, ty]
                // item.transform or viewport.convertToViewportPoint?

                // Using viewport.convertToViewportPoint is more reliable matching our Viewer logic
                // The item.transform[4], item.transform[5] are PDF x,y.
                // But text is drawn from bottom-left (usually).

                const tx = pdfjsLib.Util.transform(
                    viewport.transform,
                    item.transform
                );

                // Calculate dimensions
                // width is available in item.width (in PDF units?)
                // converting width to viewport scale
                const fontScale = item.transform[0] || 1; // Approx scale
                const width = item.width * (viewport.scale); // This might be simplistic

                // Better approach: use the same logic as PDFPageViewer.tsx if possible
                // In PDFPageViewer we used:
                // const transform = pdfjsLib.Util.transform(viewport.transform, item.transform);
                // x: transform[4], y: transform[5] - height...

                // Let's refine based on typical PDF.js text layer logic
                // viewport.convertToViewportPoint(x, y)

                // PDF coords to Viewport Point
                // item.transform[4] is x, item.transform[5] is y
                const [vx, vy] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);

                // Text height is roughly fontSize * scaleY
                // item.transform[3] is scaleY * fontScale?
                // Usually item.height is available in some versions, but 'height' property on item from getTextContent works differently.
                // item.height is strictly bounding box height in newer versions.

                const fontSize = Math.sqrt((item.transform[0] * item.transform[0]) + (item.transform[1] * item.transform[1]));
                // Viewport height
                const vHeight = fontSize * Math.abs(viewport.transform[3]); // Approx

                // vy is the baseline? 
                // PDF.js text layer renders at (vx, vy - vHeight) basically due to coordinate flip?
                // Actually, viewport.convertToViewportPoint handles the flip.
                // (0,0) in PDF is bottom-left. (0,0) in Viewport is top-left.
                // So vy likely represents the "top" after conversion? 
                // Wait. convertToViewportPoint(x, y) where x,y are PDF point.
                // If y=0 (bottom), viewport y will be 'height'.
                // If y=height (top), viewport y will be 0.

                // So vy is the point on canvas corresponding to the text anchor (usually baseline start).
                // So the box top is likely vy - vHeight (font ascent).

                // Corrections:
                // In PDFPageViewer we adjusted: y: y - height + (height * 0.2) or something.
                // Let's stick to a robust approximation for hits.

                const itemWidth = item.width * viewport.scale; // Width in viewport pixels
                const itemHeight = (item.height || fontSize) * viewport.scale; // Height

                // Adjust Y to be Top-Left
                // convertToViewportPoint returns the position of the transform origin.
                // For text, it's usually the baseline.
                // So we need to subtract the font ascent to get the Top Y.
                const topY = vy - itemHeight;

                allTextItems.push({
                    str: item.str,
                    x: vx,
                    y: topY,
                    width: itemWidth,
                    height: itemHeight,
                    pageIndex: i - 1, // 0-based
                    fontName: item.fontName,
                    fontSize: fontSize
                });
            }
        }
    }

    return allTextItems;
}
