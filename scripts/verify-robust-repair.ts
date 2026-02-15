
import { repairPDF } from '../lib/pdf-utils';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

// Mock Browser Environment 
// We refrain from importing 'canvas' to avoid Node-gyp issues if not installed.
// We will stub the Deep Repair part or just verify EOF fix.

class MockFile {
    name: string;
    type: string;
    size: number;
    lastModified: number;
    private buffer: Buffer;

    constructor(buffer: Buffer, name: string) {
        this.buffer = buffer;
        this.name = name;
        this.type = 'application/pdf';
        this.size = buffer.length;
        this.lastModified = Date.now();
    }

    arrayBuffer(): Promise<ArrayBuffer> {
        return Promise.resolve(
            this.buffer.buffer.slice(
                this.buffer.byteOffset,
                this.buffer.byteOffset + this.buffer.byteLength
            ) as ArrayBuffer
        );
    }
}

async function runTest() {
    console.log('Starting Robust Repair PDF verification...');

    // 1. Create a valid PDF
    console.log('Creating valid PDF...');
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    page.drawText('Test PDF for Robust Repair.');
    const pdfBytes = await pdfDoc.save();

    // --- Test EOF Fix ---
    console.log('\n--- Test: Missing EOF Fix ---');
    const pdfString = Buffer.from(pdfBytes).toString('binary');
    // Remove %%EOF
    const truncatedString = pdfString.replace('%%EOF', '');
    const truncatedBuffer = Buffer.from(truncatedString, 'binary');

    console.log('Created truncated PDF (missing %%EOF).');
    const truncatedFile = new MockFile(truncatedBuffer, 'no_eof.pdf') as unknown as File;

    try {
        const repairedBytes = await repairPDF(truncatedFile);
        const repairedDoc = await PDFDocument.load(repairedBytes);
        console.log(`SUCCESS: PDF with missing EOF was repaired. Pages: ${repairedDoc.getPageCount()}`);
    } catch (e) {
        console.error('FAILURE: Missing EOF check failed.', e);
        process.exit(1);
    }

    console.log('\n--- Note: Deep Repair (Rasterization) ---');
    console.log('Skipping Deep Repair test in Node.js as it requires DOM Canvas API.');
    console.log('The logic has been implemented in lib/pdf-utils.ts to trigger on detailed failures.');
}

runTest().catch(e => {
    console.error('Test script failed:', e);
    process.exit(1);
});
