
import { PDFDocument } from 'pdf-lib';
import { convertImagesToPrintPdf } from '../lib/services/pdf/print/imageToPrintPdf';

async function runTest() {
    console.log("Starting Print PDF Verification...");

    const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const pngBuffer = Buffer.from(pngBase64, 'base64');

    // Create standard ArrayBuffer from Node Buffer
    const arrayBuffer = pngBuffer.buffer.slice(pngBuffer.byteOffset, pngBuffer.byteOffset + pngBuffer.byteLength);

    // Test 1: 300 DPI
    console.log("Test 1: 300 DPI");
    try {
        const pdfBytes = await convertImagesToPrintPdf(
            [{ buffer: arrayBuffer, type: 'image/png' }],
            { dpi: 300, pageSize: 'original' }
        );

        const pdfDoc = await PDFDocument.load(pdfBytes);
        const page = pdfDoc.getPages()[0];
        const { width, height } = page.getSize();

        console.log(`Page Size: ${width}x${height} points`);

        // Expected: (1 / 300) * 72 = 0.24
        if (Math.abs(width - 0.24) < 0.01) {
            console.log("✅ 300 DPI Scale Correct (0.24 pts)");
        } else {
            console.error(`❌ 300 DPI Scale Incorrect. Expected 0.24, got ${width}`);
            process.exit(1);
        }

    } catch (e) {
        console.error("Test failed", e);
        process.exit(1);
    }

    // Test 2: 72 DPI (Standard)
    console.log("Test 2: 72 DPI");
    try {
        const pdfBytes = await convertImagesToPrintPdf(
            [{ buffer: arrayBuffer, type: 'image/png' }],
            { dpi: 72, pageSize: 'original' }
        );

        const pdfDoc = await PDFDocument.load(pdfBytes);
        const page = pdfDoc.getPages()[0];
        const { width, height } = page.getSize();

        console.log(`Page Size: ${width}x${height} points`);

        // Expected: (1 / 72) * 72 = 1
        if (Math.abs(width - 1.0) < 0.01) {
            console.log("✅ 72 DPI Scale Correct (1.0 pts)");
        } else {
            console.error(`❌ 72 DPI Scale Incorrect. Expected 1.0, got ${width}`);
            process.exit(1);
        }

    } catch (e) {
        console.error("Test failed", e);
        process.exit(1);
    }

    console.log("Print PDF Verification Passed.");
}

runTest().catch(e => console.error(e));
