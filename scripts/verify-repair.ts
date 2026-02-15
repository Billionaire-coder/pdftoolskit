
import { repairPDF } from '../lib/pdf-utils';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

// Mock File class for Node environment
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

    stream(): any { throw new Error("Not implemented"); }
    text(): Promise<string> { throw new Error("Not implemented"); }
    slice(): any { throw new Error("Not implemented"); }
}

async function runTest() {
    console.log('Starting Repair PDF verification...');

    // 1. Create a valid PDF
    console.log('Creating valid PDF...');
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    page.drawText('This is a test PDF for repair verification.');
    const pdfBytes = await pdfDoc.save();

    // 2. Corrupt it by adding garbage at the start
    console.log('Corrupting PDF...');
    const garbage = Buffer.from('GARBAGE_DATA_AT_START_OF_FILE__');
    const validBuffer = Buffer.from(pdfBytes);
    const corruptedBuffer = Buffer.concat([garbage, validBuffer]);

    // 3. Create MockFile
    // @ts-ignore - MockFile intentionally matches partial File interface needed
    const corruptedFile = new MockFile(corruptedBuffer, 'corrupted.pdf') as unknown as File;

    // 4. Attempt repair
    console.log('Attempting repair...');
    try {
        const repairedBytes = await repairPDF(corruptedFile);

        // 5. Verify the result is a valid PDF
        console.log('Repair finished. Verifying result...');
        const repairedDoc = await PDFDocument.load(repairedBytes);
        console.log(`Repaired PDF has ${repairedDoc.getPageCount()} page(s).`);
        console.log('SUCCESS: PDF was repaired and loaded successfully.');

    } catch (error) {
        console.error('FAILURE: Repair threw an error:', error);
        process.exit(1);
    }
}

runTest().catch(e => {
    console.error('Test script failed:', e);
    process.exit(1);
});
