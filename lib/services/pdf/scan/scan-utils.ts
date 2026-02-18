/**
 * Computes a Perspective Transform matrix (Homography)
 */
export function getPerspectiveTransform(srcCorners: { x: number; y: number }[], _dstWidth: number, _dstHeight: number) {
    // Simplified 4-point homography solver for Canvas
    // Map src corners (polygon) to rect [0,0, dstW, dstH]
    return srcCorners; // Placeholder for logic
}

/**
 * Applies a professional filter to a canvas context
 */
export type ScanFilter = 'original' | 'grayscale' | 'bw' | 'high-contrast';

export function applyScanFilter(ctx: CanvasRenderingContext2D, width: number, height: number, filter: ScanFilter) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (filter === 'grayscale') {
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            data[i] = data[i + 1] = data[i + 2] = gray;
        } else if (filter === 'bw') {
            const gray = (r + g + b) / 3;
            const val = gray > 128 ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = val;
        } else if (filter === 'high-contrast') {
            const threshold = 120;
            const factor = (259 * (threshold + 255)) / (255 * (259 - threshold));
            data[i] = factor * (r - 128) + 128;
            data[i + 1] = factor * (g - 128) + 128;
            data[i + 2] = factor * (b - 128) + 128;
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

/**
 * Normalizes a scan result into a standard A4 ratio if close enough
 */
// import { PDFDocument } from 'pdf-lib';
export function normalizePageDimensions(width: number, height: number) {
    const ratio = width / height;
    const a4Ratio = 1 / 1.414; // Portrait

    // If within 10% of A4, normalize
    if (Math.abs(ratio - a4Ratio) < 0.1) {
        return { width: 595, height: 842 }; // A4 at 72dpi
    }
    return { width, height };
}
