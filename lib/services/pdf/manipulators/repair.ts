import { PDFDocument } from 'pdf-lib';
import { applyBranding } from '../core';
import { rasterizeAndCompressPDF } from './compression';

/**
 * Deep Repair using PDF.js rasterization (Scale 2.0, Quality 0.95)
 */
async function deepRepairPDF(file: File): Promise<Uint8Array> {
    // console.log('Attempting Deep Repair (Rasterization)...');
    return await rasterizeAndCompressPDF(file, 0.95, 2.0);
}

/**
 * Repair PDF by rebuilding structure or deep rasterization
 */
export async function repairPDF(file: File): Promise<Uint8Array> {
    let arrayBuffer = await file.arrayBuffer();

    // Check for PDF header signature
    const headerParams = new Uint8Array(arrayBuffer.slice(0, 1024));
    const headerString = String.fromCharCode(...Array.from(headerParams));
    const pdfHeaderIndex = headerString.indexOf('%PDF-');

    if (pdfHeaderIndex === -1) {
        const deepScanLimit = Math.min(arrayBuffer.byteLength, 50 * 1024);
        const deepParams = new Uint8Array(arrayBuffer.slice(0, deepScanLimit));
        const deepString = String.fromCharCode(...Array.from(deepParams));
        const deepIndex = deepString.indexOf('%PDF-');

        if (deepIndex > 0) {
            arrayBuffer = arrayBuffer.slice(deepIndex);
        } else {
            return await deepRepairPDF(file);
        }
    }

    try {
        const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        applyBranding(pdf);
        return await pdf.save();
    } catch {
        return await deepRepairPDF(file);
    }
}
