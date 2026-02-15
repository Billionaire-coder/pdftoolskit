import { PDFDocument, PDFPage } from 'pdf-lib';
import { applyBranding, getGlobalPDFLib } from './core';

export async function protectPDF(file: File, userPassword: string, ownerPassword?: string): Promise<Uint8Array> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const PDFLib = await getGlobalPDFLib();

        const sourcePdf = await PDFLib.PDFDocument.load(arrayBuffer);
        const newPdf = await PDFLib.PDFDocument.create();

        const pages = await newPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
        pages.forEach((page: PDFPage) => newPdf.addPage(page));

        applyBranding(newPdf);

        const hasEncryptMethod = typeof newPdf.encrypt === 'function';

        if (hasEncryptMethod) {
            (newPdf as any).encrypt({
                userPassword: userPassword,
                ownerPassword: ownerPassword || userPassword,
                permissions: {
                    printing: 'highResolution',
                    modifying: false,
                    copying: false,
                    annotating: false,
                    fillingForms: false,
                    contentAccessibility: false,
                    documentAssembly: false,
                },
            });
        }

        const encryptedBytes = await newPdf.save({
            userPassword: userPassword,
            ownerPassword: ownerPassword || userPassword,
        });

        // Verification
        try {
            await PDFDocument.load(encryptedBytes, { ignoreEncryption: false });
            throw new Error('Encryption verification failed: The document remained unlocked.');
        } catch (e: unknown) {
            if (e instanceof Error && e.message.includes('Encryption verification failed')) throw e;
        }

        return encryptedBytes;
    } catch (error) {
        console.error('Protect PDF failed:', error);
        throw error;
    }
}

export async function unlockPDF(file: File, password: string): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    try {
        const PDFLib = await getGlobalPDFLib();
        let encryptedPdf;
        try {
            encryptedPdf = await PDFLib.PDFDocument.load(arrayBuffer, {
                password: password,
                ignoreEncryption: false
            });
        } catch (loadError: unknown) {
            if (loadError instanceof Error && loadError.message && (loadError.message.includes('Input document') && loadError.message.includes('is encrypted'))) {
                throw new Error('Incorrect password OR unsupported encryption (AES-256 R6). Please check your password.');
            }
            throw loadError;
        }

        const newPdf = await PDFLib.PDFDocument.create();
        const pages = await newPdf.copyPages(encryptedPdf, encryptedPdf.getPageIndices());
        pages.forEach((page: PDFPage) => newPdf.addPage(page));

        applyBranding(newPdf);
        return await newPdf.save();
    } catch (error: unknown) {
        console.error('Unlock failed:', error);
        if (error instanceof Error && error.message && (error.message.includes('Incorrect password') || error.message.includes('is encrypted'))) {
            throw new Error('Incorrect password or unsupported encryption type.');
        }
        throw error;
    }
}
