
import { PDFDocument } from 'pdf-lib';
import { compressPDF } from '../lib/pdf-utils';

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
    console.log('--- Verifying Metadata Persistence ---');

    const doc = await PDFDocument.create();
    doc.addPage();
    doc.setProducer('ORIGINAL_PRODUCER');
    const bytes = await doc.save();

    // Test compressPDF (using DEBUG mode where useObjectStreams=false)
    console.log('\nTesting compressPDF...');
    const file = new MockFile(Buffer.from(bytes), 'test.pdf') as unknown as File;
    const compressedBytes = await compressPDF(file);
    const compressedDoc = await PDFDocument.load(compressedBytes);

    console.log(`Compressed Producer (via getProducer): ${compressedDoc.getProducer()}`);

    // --- BYTES INSPECTION ---
    console.log('--- Byte Inspection ---');
    const byteStr = Buffer.from(compressedBytes).toString('binary');

    const pIndex = byteStr.indexOf('Producer');
    if (pIndex !== -1) {
        console.log(`Found 'Producer' key at index ${pIndex}. Value snippet:`);
        console.log(byteStr.substring(pIndex, pIndex + 100).replace(/[^\x20-\x7E]/g, '.'));
    } else {
        console.log("NOT FOUND 'Producer' key in plain text.");
    }

    const hIndex = byteStr.indexOf('Hopding');
    if (hIndex !== -1) {
        console.log(`FOUND 'Hopding' at ${hIndex}! The library default string IS present.`);
    } else {
        console.log("NOT FOUND 'Hopding'. The library default string is NOT in the file bytes.");
        if (compressedDoc.getProducer()?.includes('Hopding')) {
            console.log("CONCLUSION: getProducer() returns a default value when it cannot parse the actual value.");
        }
    }
}

runTest().catch(console.error);
