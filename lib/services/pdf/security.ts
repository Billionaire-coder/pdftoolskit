import { PDFDocument, PDFPage } from 'pdf-lib';
import { applyBranding, getGlobalPDFLib } from './core';

export interface ProtectionOptions {
    userPassword: string;
    ownerPassword?: string;
    permissions?: {
        printing?: 'highResolution' | 'lowResolution' | 'none';
        modifying?: boolean;
        copying?: boolean;
        annotating?: boolean;
        fillingForms?: boolean;
        contentAccessibility?: boolean;
        documentAssembly?: boolean;
    };
    encryptMetadata?: boolean;
}

export async function protectPDF(file: File, options: ProtectionOptions): Promise<Uint8Array> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const PDFLib = await getGlobalPDFLib();

        const sourcePdf = await PDFLib.PDFDocument.load(arrayBuffer);
        const newPdf = await PDFLib.PDFDocument.create();

        const pages = await newPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
        pages.forEach((page: PDFPage) => newPdf.addPage(page));

        // Metadata Encryption Handling
        if (options.encryptMetadata === false) {
            // If we want to keep metadata visible, we might need to copy it over explicitly 
            // and rely on pdf-lib's encryption behavior. 
            // However, StandardSecurityHandler usually encrypts everything. 
            // PDF 2.0 allows unencrypted metadata, but pdf-lib is 1.7 based.
            // We will try to preserve the Info dict, but standard behavior is full encryption.
            // Best effort: Copy info.
            const title = sourcePdf.getTitle();
            const author = sourcePdf.getAuthor();
            const subject = sourcePdf.getSubject();
            const producer = sourcePdf.getProducer();
            const creator = sourcePdf.getCreator();

            if (title) newPdf.setTitle(title);
            if (author) newPdf.setAuthor(author);
            if (subject) newPdf.setSubject(subject);
            if (producer) newPdf.setProducer(producer);
            if (creator) newPdf.setCreator(creator);
        } else {
            applyBranding(newPdf);
        }


        const hasEncryptMethod = typeof newPdf.encrypt === 'function';

        if (hasEncryptMethod) {
            // Map our high-level permissions to pdf-lib's structure
            const permissionSettings = {
                printing: options.permissions?.printing || 'highResolution',
                modifying: options.permissions?.modifying ?? false,
                copying: options.permissions?.copying ?? false,
                annotating: options.permissions?.annotating ?? false,
                fillingForms: options.permissions?.fillingForms ?? false,
                contentAccessibility: options.permissions?.contentAccessibility ?? false,
                documentAssembly: options.permissions?.documentAssembly ?? false,
            };

            (newPdf as any).encrypt({
                userPassword: options.userPassword,
                ownerPassword: options.ownerPassword || options.userPassword,
                permissions: permissionSettings,
            });
        }

        const encryptedBytes = await newPdf.save();

        // Verification (Basic check if it opens without password - it shouldn't)
        try {
            await PDFDocument.load(encryptedBytes, { ignoreEncryption: false });
            throw new Error('Encryption verification failed: The document remained unlocked.');
        } catch (e: unknown) {
            if (e instanceof Error && e.message.includes('Encryption verification failed')) throw e;
            // Expected to fail loading
        }

        return encryptedBytes;
    } catch (error) {
        console.error('Protect PDF failed:', error);
        throw error;
    }
}

export interface SecurityAnalysis {
    isEncrypted: boolean;
    isOwnerLocked: boolean; // True if it has restrictions but can be opened without password (or with user password)
    isOpenLocked: boolean; // True if it requires a password to even open
}

export async function analyzeSecurity(file: File): Promise<SecurityAnalysis> {
    const arrayBuffer = await file.arrayBuffer();
    const PDFLib = await getGlobalPDFLib();

    try {
        // Try to load without password first
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

        // If it loads, check if it has encryption dictionary
        const isEncrypted = pdfDoc.isEncrypted;

        return {
            isEncrypted,
            isOwnerLocked: isEncrypted, // If it loaded but is encrypted, it's owner locked (permissions only)
            isOpenLocked: false
        };
    } catch (error: any) {
        if (error.message && error.message.includes('Password required')) {
            return {
                isEncrypted: true,
                isOwnerLocked: false,
                isOpenLocked: true
            };
        }
        // Some other error
        console.error('Security analysis error:', error);
        return {
            isEncrypted: false,
            isOwnerLocked: false,
            isOpenLocked: false
        };
    }
}

export async function unlockPDF(file: File, password?: string): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    try {
        const PDFLib = await getGlobalPDFLib();
        let encryptedPdf;

        // Strategy 1: Try exact password or empty
        try {
            encryptedPdf = await PDFLib.PDFDocument.load(arrayBuffer, {
                password: password || undefined,
                ignoreEncryption: false
            });
        } catch (loadError: unknown) {
            // Strategy 2: If failed, and no password provided, maybe it's Open-Locked
            if (loadError instanceof Error && loadError.message && (loadError.message.includes('Input document') && loadError.message.includes('is encrypted'))) {
                throw new Error('This document is Password Locked. Please enter the Open Password.');
            }
            if (loadError instanceof Error && loadError.message.includes('Incorrect password')) {
                throw new Error('Incorrect password.');
            }
            throw loadError;
        }

        const newPdf = await PDFLib.PDFDocument.create();
        const pages = await newPdf.copyPages(encryptedPdf, encryptedPdf.getPageIndices());
        pages.forEach((page: PDFPage) => newPdf.addPage(page));

        // Saving without encryption options effectively strips the security
        applyBranding(newPdf);
        return await newPdf.save();
    } catch (error: unknown) {
        console.error('Unlock failed:', error);
        if (error instanceof Error && error.message && (error.message.includes('Incorrect password') || error.message.includes('is encrypted'))) {
            // Passthrough meaningful errors
            throw error;
        }
        throw new Error('Failed to unlock PDF. The file might be corrupted or use unsupported encryption.');
    }
}
