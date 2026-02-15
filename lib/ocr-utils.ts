import type { Worker } from 'tesseract.js';

export async function preprocessImage(blob: Blob): Promise<string> {
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
}

export async function initOCRWorker(): Promise<Worker> {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');
    return worker;
}

export async function performOCR(worker: Worker, blob: Blob): Promise<string[]> {
    const processedUrl = await preprocessImage(blob);
    const { data } = await worker.recognize(processedUrl);

    // Tesseract v6 compatibility: Use text property directly
    const text = data.text || '';
    return text.split('\n');
}
