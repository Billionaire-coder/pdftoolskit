// @ts-ignore - Importing full bundle to ensure encryption support
import { PDFDocument, StandardFonts, rgb, degrees, PDFName, PDFString, PDFDict } from 'pdf-lib';
import { Document, Paragraph, TextRun, Packer } from 'docx';
import { initOCRWorker, performOCR } from './ocr-utils';
import { Worker } from 'tesseract.js';

export function applyBranding(pdfDoc: PDFDocument) {
    // Force ASCII string to ensure compatibility and correct parsing
    pdfDoc.setModificationDate(new Date());

    // Direct low-level access to ensure it's written as a string (foo) not hex <fe...>
    // This fixes the issue where pdf-lib's getProducer() returns default if it sees hex it doesn't like?
    // Or just robustly sets it.
    const producer = PDFString.of('PDFToolkit');
    const creator = PDFString.of('PDFToolkit');

    // Check if we can access context and Info
    // @ts-ignore - low level access
    if (pdfDoc.context && pdfDoc.context.trailerInfo && pdfDoc.context.trailerInfo.Info) {
        // @ts-ignore
        const infoRef = pdfDoc.context.trailerInfo.Info;
        // @ts-ignore
        const info = pdfDoc.context.lookup(infoRef);
        if (info instanceof PDFDict) {
            info.set(PDFName.of('Producer'), producer);
            info.set(PDFName.of('Creator'), creator);
            return;
        }
    }

    // Fallback if low-level fails
    pdfDoc.setProducer('PDFToolkit');
    pdfDoc.setCreator('PDFToolkit');
}

export async function mergePDFs(files: File[]): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page: any) => mergedPdf.addPage(page));
    }

    // Set metadata
    applyBranding(mergedPdf);
    return await mergedPdf.save();
}

export async function splitPDF(file: File, pageRanges: { start: number; end: number }[]): Promise<Uint8Array[]> {
    const arrayBuffer = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(arrayBuffer);
    const results: Uint8Array[] = [];

    for (const range of pageRanges) {
        const newPdf = await PDFDocument.create();
        const pages = await newPdf.copyPages(
            sourcePdf,
            Array.from({ length: range.end - range.start + 1 }, (_, i) => range.start + i)
        );
        pages.forEach((page: any) => newPdf.addPage(page));
        applyBranding(newPdf);
        results.push(await newPdf.save());
    }

    return results;
}

export async function removePagesFromPDF(file: File, pageIndicesToRemove: number[]): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const totalPages = pdf.getPageCount();

    const pagesToKeep = Array.from({ length: totalPages }, (_, i) => i)
        .filter(i => !pageIndicesToRemove.includes(i));

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(pdf, pagesToKeep);
    copiedPages.forEach((page: any) => newPdf.addPage(page));

    applyBranding(newPdf);
    return await newPdf.save();
}

export async function rotatePDF(file: File, rotation: 90 | 180 | 270): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = pdf.getPages();

    pages.forEach((page: any) => {
        const currentRotation = page.getRotation().angle;
        const newRotation = (currentRotation + rotation) % 360;
        // Type assertion needed - pdf-lib Rotation type is strictly 0 | 90 | 180 | 270
        page.setRotation({ type: 'degrees', angle: newRotation } as any);
    });

    applyBranding(pdf);
    return await pdf.save();
}

export async function organizePDF(file: File, newPageOrder: number[]): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(arrayBuffer);
    const newPdf = await PDFDocument.create();

    const copiedPages = await newPdf.copyPages(sourcePdf, newPageOrder);
    copiedPages.forEach((page: any) => newPdf.addPage(page));

    applyBranding(newPdf);
    return await newPdf.save();
}

export async function getMetadata(file: File): Promise<any> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    return {
        title: pdfDoc.getTitle(),
        author: pdfDoc.getAuthor(),
        subject: pdfDoc.getSubject(),
        creator: pdfDoc.getCreator(),
        producer: pdfDoc.getProducer(),
        creationDate: pdfDoc.getCreationDate(),
        modificationDate: pdfDoc.getModificationDate(),
        keywords: pdfDoc.getKeywords(),
        pageCount: pdfDoc.getPageCount(),
    };
}

export async function stripMetadata(file: File): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setCreator('PDFToolkit');
    pdfDoc.setProducer('PDFToolkit');
    pdfDoc.setKeywords([]);

    // Wipe dates
    const zeroDate = new Date(0);
    pdfDoc.setCreationDate(zeroDate);
    pdfDoc.setModificationDate(zeroDate);

    return await pdfDoc.save();
}

export async function compressPDF(
    file: File,
    quality: number = 0.7,
    targetSizeBytes?: number
): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);

    // 1. Standard Optimization (Metadata removal)
    pdf.setTitle('');
    pdf.setAuthor('');
    pdf.setSubject('');
    pdf.setKeywords([]);
    applyBranding(pdf);

    // Save with compression options
    let compressed = await pdf.save({
        useObjectStreams: true, // Compress PDF structure
        addDefaultPage: false,
        objectsPerTick: 50,
    });

    // 2. Check Effectiveness
    const reductionRatio = (file.size - compressed.length) / file.size;
    const isStandardMode = !targetSizeBytes; // 'extreme', 'recommended', 'less'

    // If standard mode yielded poor results (< 5% savings) AND we want compression
    if (isStandardMode && reductionRatio < 0.05) {
        if (quality <= 0.5) {
            // Extreme Mode: Force aggressive rasterization
            console.log("Standard compression ineffective for Extreme mode. Switching to Rasterization (Scale: 1.0, Q: 0.5)");
            try {
                const deepCompressed = await rasterizeAndCompressPDF(file, 0.5, 1.0);
                if (deepCompressed.length < compressed.length) {
                    compressed = deepCompressed;
                }
            } catch (e) { console.warn("Deep compression failed", e); }
        } else if (quality <= 0.75) {
            // Recommended Mode: Try rasterization with better quality
            console.log("Standard compression ineffective for Recommended mode. Switching to Rasterization (Scale: 1.5, Q: 0.7)");
            try {
                const deepCompressed = await rasterizeAndCompressPDF(file, 0.7, 1.5);
                if (deepCompressed.length < compressed.length) {
                    compressed = deepCompressed;
                }
            } catch (e) { console.warn("Deep compression failed", e); }
        }
        // 'Less' mode (quality > 0.8) stays standard to preserve max quality
    }

    // 3. Check Target Size (Custom Mode)
    if (targetSizeBytes && compressed.length > targetSizeBytes) {
        console.log(`Standard result (${compressed.length}) > Target (${targetSizeBytes}). Starting Force Compression Loop...`);

        // Force Compression Settings
        let currentScale = 1.5;
        let currentQuality = quality; // Start with requested quality
        let bestResult = compressed;
        let attempts = 0;
        const maxAttempts = 6;

        // Initial Aggression based on gap
        const gapRatio = compressed.length / targetSizeBytes;
        if (gapRatio > 3) {
            currentScale = 1.0;
            currentQuality = 0.5;
        } else if (gapRatio > 2) {
            currentScale = 1.2;
            currentQuality = 0.6;
        }

        while (attempts < maxAttempts) {
            attempts++;
            console.log(`[Attempt ${attempts}] Target: ${targetSizeBytes}, Scale: ${currentScale.toFixed(2)}, Quality: ${currentQuality.toFixed(2)}`);

            try {
                const deepCompressed = await rasterizeAndCompressPDF(file, currentQuality, currentScale);

                console.log(`[Attempt ${attempts}] Result: ${deepCompressed.length}`);

                // If effective, keep it
                if (deepCompressed.length < bestResult.length) {
                    bestResult = deepCompressed;
                }

                // Success?
                if (deepCompressed.length <= targetSizeBytes) {
                    console.log(`Target met on attempt ${attempts}!`);
                    return deepCompressed;
                }

                // If not met, reduce settings for next loop
                currentQuality -= 0.15;
                currentScale -= 0.2;

                // Hard Floors
                if (currentQuality < 0.1) currentQuality = 0.1;
                if (currentScale < 0.4) currentScale = 0.4; // readability limit

                // If we're already at floor, break
                if (currentQuality <= 0.15 && currentScale <= 0.45) {
                    console.warn("Hit quality floor, returning best result.");
                    break;
                }

            } catch (e) {
                console.warn(`Attempt ${attempts} failed:`, e);
                break; // Stop on error
            }
        }

        compressed = bestResult;
        if (compressed.length > targetSizeBytes) {
            console.warn(`Failed to meet target ${targetSizeBytes} after ${attempts} attempts. Best: ${compressed.length}`);
        }
    }

    return compressed;
}

// Helper to load the full pdf-lib bundle from public folder to ensure encryption support
async function getGlobalPDFLib(): Promise<any> {
    if (typeof window === 'undefined') {
        // Fallback for SSR/Node (though encryption might fail here if not using correct node build)
        // We shouldn't really be doing this on server for this tool usually.
        return { PDFDocument, StandardFonts, rgb, degrees, PDFName, PDFString, PDFDict };
    }

    // @ts-ignore
    if (window.PDFLib) {
        // @ts-ignore
        return window.PDFLib;
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        // Use unminified CDN for better debugging and potential version fix
        script.src = 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.js';
        script.onload = () => {
            // @ts-ignore
            if (window.PDFLib) {
                // @ts-ignore
                console.log('PDFLib loaded via CDN (Unminified).');
                // @ts-ignore
                resolve(window.PDFLib);
            } else {
                reject(new Error('PDFLib not found in window after script load'));
            }
        };
        script.onerror = () => reject(new Error('Failed to load pdf-lib script'));
        document.head.appendChild(script);
    });
}

/**
 * Password protect a PDF file
 * Adds user password protection using standard encryption
 */
export async function protectPDF(file: File, userPassword: string, ownerPassword?: string): Promise<Uint8Array> {
    try {
        const arrayBuffer = await file.arrayBuffer();

        // Get library with retry
        const PDFLib = await getGlobalPDFLib();

        const sourcePdf = await PDFLib.PDFDocument.load(arrayBuffer);
        const newPdf = await PDFLib.PDFDocument.create();

        // Copy pages from source
        const pages = await newPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
        pages.forEach((page: any) => newPdf.addPage(page));

        // Modern API check

        applyBranding(newPdf);

        // Deep Diagnostics
        const isSecure = window.isSecureContext;
        // @ts-ignore
        const hasEncryptMethod = typeof newPdf.encrypt === 'function';

        let cryptoTest = 'Not Run';
        if (window.crypto && window.crypto.subtle) {
            try {
                await window.crypto.subtle.digest('SHA-256', new Uint8Array([1, 2, 3]));
                cryptoTest = 'Passed';
            } catch (e) {
                cryptoTest = 'Failed: ' + String(e);
            }
        }

        console.log('Protecting PDF - Diagnostics:', {
            // @ts-ignore
            pdfLibVersion: PDFLib.version,
            isSecureContext: isSecure,
            hasEncryptMethod: hasEncryptMethod,
            cryptoTest: cryptoTest
        });

        // If the instance has a direct encrypt method, TRY IT.
        if (hasEncryptMethod) {
            console.log('Attempting direct .encrypt() call...');
            // @ts-ignore
            newPdf.encrypt({
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

        // --- ISOLATION TEST: Blank PDF ---
        try {
            // @ts-ignore
            const blankDoc = await PDFLib.PDFDocument.create();
            // @ts-ignore
            blankDoc.addPage([100, 100]);
            // @ts-ignore
            const blankEncrypted = await blankDoc.save({ userPassword: 'test', ownerPassword: 'test' });
            // Unlock check
            try {
                // @ts-ignore
                await PDFLib.PDFDocument.load(blankEncrypted, { ignoreEncryption: false });
                console.error('DIAGNOSTIC FAIL: Blank PDF Test -> Loaded WITHOUT password. Library is definitely ignoring encryption.');
            } catch (e) {
                console.log('DIAGNOSTIC PASS: Blank PDF Test -> Requires password. Library IS functional.');
            }
        } catch (e) {
            console.error('DIAGNOSTIC ERROR: Blank PDF Test crashed:', e);
        }
        // --------------------------------

        // Standard pdf-lib encryption via save options
        // @ts-ignore
        const encryptedBytes = await newPdf.save({
            userPassword: userPassword,
            ownerPassword: ownerPassword || userPassword,
            // Temporarily removed permissions to rule out conflicts
            /* permissions: {
                printing: 'highResolution',
                modifying: false,
                copying: false,
                annotating: false,
                fillingForms: false,
                contentAccessibility: false,
                documentAssembly: false,
            } */
        });

        // VERIFICATION: Verify that the output is actually encrypted
        // Attempt to load the just-saved PDF bytes without a password.
        // If it loads successfully, encryption FAILED.
        try {
            // @ts-ignore
            await PDFDocument.load(encryptedBytes, { ignoreEncryption: false });
            // If we reach here, it loaded without error -> Encryption FAILED
            throw new Error('Encryption verification failed: The document remained unlocked.');
        } catch (e: any) {
            // Expected error similar to "Input document is encrypted..."
            // If it's the specific verification error we just threw, rethrow it
            if (e.message.includes('Encryption verification failed')) {
                throw e;
            }
            // Otherwise, if it's an encryption error, that means it worked!
            // check for common pdf-lib encryption error message
            const isEncryptedError = e.message.includes('encrypted') || e.message.includes('Password');
            if (!isEncryptedError) {
                // Some other error occurred during verification load?
                console.warn('Unexpected error during encryption verification:', e);
            }
        }

        return encryptedBytes;
    } catch (error) {
        console.error('Protect PDF failed:', error);
        throw error;
    }
}

/**
 * Unlock a password-protected PDF
 * Removes password by copying pages to a new document
 */
export async function unlockPDF(file: File, password: string): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();

    try {
        // Get library with retry
        const PDFLib = await getGlobalPDFLib();

        // Load the encrypted PDF with the password
        let encryptedPdf;
        try {
            // @ts-ignore
            encryptedPdf = await PDFLib.PDFDocument.load(arrayBuffer, {
                password: password,
                ignoreEncryption: false
            });
        } catch (loadError: any) {
            console.warn("Initial load failed:", loadError);

            // Should we try empty password if the provided one failed? 
            // Only if password was NOT empty, maybe they made a mistake and it's actually blank-protected?
            // No, that's guessing. 

            // Check for specific unsupported encryption error
            if (loadError.message && (loadError.message.includes('Input document') && loadError.message.includes('is encrypted'))) {
                // This error usually means pdf-lib couldn't decrypt it with the given password 
                // OR it's an unsupported encryption type (like AES-256 R6)
                throw new Error('Incorrect password OR unsupported encryption (AES-256 R6). Please check your password.');
            }
            throw loadError;
        }

        // Create a new blank PDF
        const newPdf = await PDFLib.PDFDocument.create();

        // Copy all pages from the encrypted PDF to the new one
        const pages = await newPdf.copyPages(encryptedPdf, encryptedPdf.getPageIndices());

        // Add pages to the new PDF
        pages.forEach((page: any) => newPdf.addPage(page));

        // Save the new PDF (it will be unencrypted by default)
        applyBranding(newPdf);
        return await newPdf.save();
    } catch (error: any) {
        console.error('Unlock failed:', error);

        // Handle specific pdf-lib error message for wrong password/encryption
        if (error.message && (error.message.includes('Incorrect password') || error.message.includes('is encrypted'))) {
            throw new Error('Incorrect password or unsupported encryption type.');
        }

        throw error;
    }
}

/**
 * Convert PDF to Word document (DOCX)
 * Extracts text from PDF and creates a simple Word document
 */
export async function pdfToWord(file: File): Promise<{ data: Uint8Array; isScanned: boolean }> {
    try {
        const arrayBuffer = await file.arrayBuffer();

        // Load PDF using PDF.js (Dynamic Import)
        const pdfjsLib = await import('pdfjs-dist');
        if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        }

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdfDoc = await loadingTask.promise;

        const paragraphs: Paragraph[] = [];
        let ocrWorker: Worker | null = null;

        // Extract text from each page
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            const page = await pdfDoc.getPage(pageNum);
            const textContent = await page.getTextContent();

            // Add page number header
            paragraphs.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Page ${pageNum}`,
                            bold: true,
                            size: 24,
                        }),
                    ],
                    spacing: { before: 240, after: 120 },
                })
            );

            // Group items into lines to preserve layout
            const items = textContent.items as any[];
            const lines: { y: number; str: string }[] = [];
            const tolerance = 6; // Y-tolerance for same line

            // 1. Group by Y coordinate
            items.forEach(item => {
                if (!('str' in item) || !('transform' in item)) return;

                const y = item.transform[5]; // PDF y-coordinate

                // Find existing line
                let line = lines.find(l => Math.abs(l.y - y) < tolerance);
                if (!line) {
                    line = { y, str: '' };
                    lines.push(line);
                }

                // Append text
                line.str += item.str;
            });

            // 2. Sort lines from Top to Bottom (Desc Y)
            lines.sort((a, b) => b.y - a.y);

            // 3. Create Paragraphs from PDF Text
            lines.forEach(line => {
                if (line.str.trim()) {
                    paragraphs.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: line.str,
                                    size: 22, // 11pt approx
                                }),
                            ],
                            // spacing: { after: 120 }, // Reduce spacing to look like document
                        })
                    );
                }
            });

            // --- OCR FALLBACK ---
            // If no text lines found, assume scanned and run OCR
            if (lines.length === 0) {
                console.log(`Page ${pageNum} appears scanned. Running OCR...`);

                // Initialize worker if needed
                if (!ocrWorker) {
                    ocrWorker = await initOCRWorker();
                }

                // Render page to image
                const viewport = page.getViewport({ scale: 2.0 }); // High quality for OCR
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (context) {
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    await page.render({ canvasContext: context, viewport }).promise;

                    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg'));
                    if (blob) {
                        const ocrLines = await performOCR(ocrWorker, blob);
                        // Add OCR text
                        ocrLines.forEach(textLine => {
                            if (textLine.trim()) {
                                paragraphs.push(
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: textLine,
                                                size: 22,
                                            }),
                                        ],
                                    })
                                );
                            }
                        });
                    }
                }
            }

            // Add spacing between pages
            paragraphs.push(new Paragraph({ text: "", spacing: { after: 720 } }));
        }

        // Cleanup Worker
        if (ocrWorker) {
            await ocrWorker.terminate();
        }

        // Cleanup PDF document
        await pdfDoc.cleanup();
        await pdfDoc.destroy();

        // Create Word document
        const doc = new Document({
            sections: [{
                properties: {},
                children: paragraphs.length > 0 ? paragraphs : [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: 'No text content found in PDF (and OCR failed).',
                                size: 22,
                            }),
                        ],
                    }),
                ],
            }],
        });

        // Generate DOCX file
        const docxBytes = await Packer.toBuffer(doc);

        // Simple heuristic: If we have multiple pages but very little text, it's likely scanned
        const isScanned = paragraphs.length < 5 && pdfDoc.numPages > 0;

        return { data: new Uint8Array(docxBytes), isScanned };
    } catch (error) {
        console.error('PDF to Word conversion error:', error);
        throw new Error(`Failed to convert PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}



export async function addPageNumbers(
    file: File,
    options: {
        position: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';
        startFrom?: number;
        fontSize?: number;
    }
): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const count = pages.length;

    // Default options
    const fontSize = options.fontSize || 12;
    const startNum = options.startFrom || 1;

    for (let i = 0; i < count; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const text = `${i + startNum}`;
        const textWidth = helveticaFont.widthOfTextAtSize(text, fontSize);
        const textHeight = helveticaFont.heightAtSize(fontSize);

        let x = 0;
        let y = 0;
        const margin = 20;

        switch (options.position) {
            case 'bottom-left':
                x = margin;
                y = margin;
                break;
            case 'bottom-center':
                x = (width / 2) - (textWidth / 2);
                y = margin;
                break;
            case 'bottom-right':
                x = width - textWidth - margin;
                y = margin;
                break;
            case 'top-left':
                x = margin;
                y = height - textHeight - margin;
                break;
            case 'top-center':
                x = (width / 2) - (textWidth / 2);
                y = height - textHeight - margin;
                break;
            case 'top-right':
                x = width - textWidth - margin;
                y = height - textHeight - margin;
                break;
        }

        page.drawText(text, {
            x,
            y,
            size: fontSize,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });
    }

    applyBranding(pdfDoc);
    return await pdfDoc.save();
}

export async function addWatermark(
    file: File,
    watermarkText: string,
    options: {
        opacity?: number;
        size?: number;
        color?: { r: number; g: number; b: number };
    } = {}
): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    const fontSize = options.size || 50;
    const opacity = options.opacity !== undefined ? options.opacity : 0.5;
    const color = options.color ? rgb(options.color.r, options.color.g, options.color.b) : rgb(0.5, 0.5, 0.5); // Grey default

    for (const page of pages) {
        const { width, height } = page.getSize();
        const textWidth = helveticaFont.widthOfTextAtSize(watermarkText, fontSize);
        const textHeight = helveticaFont.heightAtSize(fontSize);

        page.drawText(watermarkText, {
            x: (width / 2) - (textWidth / 2),
            y: (height / 2) - (textHeight / 2),
            size: fontSize,
            font: helveticaFont,
            color: color,
            opacity: opacity,
            rotate: degrees(45),
        });
    }

    applyBranding(pdfDoc);
    return await pdfDoc.save();
}

/**
 * Crop PDF pages by setting a new MediaBox/CropBox
 * margins are in points (1/72 inch). 
 * typical page is ~595x842 points (A4)
 */
import { parsePageRange } from './utils';

export async function cropPDF(
    file: File,
    margins: { top: number; bottom: number; left: number; right: number },
    options?: {
        pageRange?: string;
        perPageCrops?: Record<number, {
            top: number; bottom: number; left: number; right: number;
            mode?: 'keep' | 'remove'; // Default 'keep'
        }>;
    }
): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    // CASE A: Specific Per-Page Crops (Advanced Mode)
    if (options?.perPageCrops && Object.keys(options.perPageCrops).length > 0) {
        const pages = pdfDoc.getPages();

        Object.entries(options.perPageCrops).forEach(([pageIndexStr, config]) => {
            const index = parseInt(pageIndexStr, 10);
            if (index >= 0 && index < pages.length) {
                const page = pages[index];
                const { x, y, width, height } = page.getMediaBox();

                // Calculate dimensions from margins
                const newX = x + config.left;
                const newY = y + config.bottom;
                const newWidth = width - config.left - config.right;
                const newHeight = height - config.top - config.bottom;

                if (newWidth > 0 && newHeight > 0) {
                    if (config.mode === 'remove') {
                        // Draw white rectangle over the area
                        page.drawRectangle({
                            x: newX,
                            y: newY,
                            width: newWidth,
                            height: newHeight,
                            color: rgb(1, 1, 1),
                        });
                    } else {
                        // Standard Crop ('keep')
                        page.setMediaBox(newX, newY, newWidth, newHeight);
                    }
                }
            }
        });
    }
    // CASE B: Global Margins with optional Range (Simple Mode)
    else {
        const totalPages = pdfDoc.getPageCount();
        const pageIndices = parsePageRange(options?.pageRange || '', totalPages);

        const pages = pdfDoc.getPages();
        pages.forEach((page: any, index: number) => {
            if (!pageIndices.includes(index)) return;

            const { x, y, width, height } = page.getMediaBox();

            const newX = x + margins.left;
            const newY = y + margins.bottom;
            const newWidth = width - margins.left - margins.right;
            const newHeight = height - margins.top - margins.bottom;

            if (newWidth > 0 && newHeight > 0) {
                page.setMediaBox(newX, newY, newWidth, newHeight);
            }
        });
    }

    applyBranding(pdfDoc);
    return await pdfDoc.save();
}

/**
 * Add an image overlay to multiple PDF pages
 */

export async function addImageToPage(
    file: File,
    imageData: Uint8Array, // PNG or JPG data
    placements: {
        pageIndex: number;
        x: number;
        y: number;
        width: number;
        height: number;
    } | {
        pageIndex: number;
        x: number;
        y: number;
        width: number;
        height: number;
    }[],
    options: {
        applyToAll?: boolean;
    } = {}
): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    // Embed image (try PNG first, then JPG)
    let image;
    try {
        image = await pdfDoc.embedPng(imageData);
    } catch {
        image = await pdfDoc.embedJpg(imageData);
    }

    const pages = pdfDoc.getPages();
    const placementList = Array.isArray(placements) ? placements : [placements];

    if (options.applyToAll && placementList.length > 0) {
        // Use the first placement geometry for ALL pages
        const template = placementList[0];

        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            // We use the same x/y/width/height. 
            // Note: Coordinate system (Y-flip) must be handled by caller typically, 
            // BUT if we are applying to all pages, and pages have different sizes, 
            // the fixed Y might be wrong if it was calculated based on Page 1's height.
            // However, usually we align relative to bottom or top.
            // If the caller passed a bottom-relative Y (native PDF), it works if pages are same height.
            // If pages differ, "fixed Y" might be off. 
            // For now, consistent X/Y is the standard behavior.

            page.drawImage(image, {
                x: template.x,
                y: template.y,
                width: template.width,
                height: template.height,
            });
        }
    } else {
        // Standard explicit placements
        for (const p of placementList) {
            if (p.pageIndex < 0 || p.pageIndex >= pages.length) {
                continue; // Skip invalid pages
            }
            const page = pages[p.pageIndex];
            page.drawImage(image, {
                x: p.x,
                y: p.y,
                width: p.width,
                height: p.height,
            });
        }
    }

    applyBranding(pdfDoc);
    return await pdfDoc.save();
}

/**
 * Add a black redaction rectangle to a PDF page
 */
export async function addRedaction(
    file: File,
    options: {
        pageIndex: number;
        x: number;
        y: number;
        width: number;
        height: number;
    }
): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    const pages = pdfDoc.getPages();
    if (options.pageIndex < 0 || options.pageIndex >= pages.length) {
        throw new Error(`Invalid page index. Document has ${pages.length} pages.`);
    }

    const page = pages[options.pageIndex];
    page.drawRectangle({
        x: options.x,
        y: options.y,
        width: options.width,
        height: options.height,
        color: rgb(0, 0, 0),
        opacity: 1,
    });

    applyBranding(pdfDoc);
    return await pdfDoc.save();
}

/**
 * Update PDF Metadata
 */
export async function updateMetadata(
    file: File,
    metadata: {
        title?: string;
        author?: string;
        subject?: string;
        keywords?: string[];
        creator?: string;
        producer?: string;
    }
): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    if (metadata.title !== undefined) pdfDoc.setTitle(metadata.title);
    if (metadata.author !== undefined) pdfDoc.setAuthor(metadata.author);
    if (metadata.subject !== undefined) pdfDoc.setSubject(metadata.subject);
    if (metadata.keywords !== undefined) pdfDoc.setKeywords(metadata.keywords);
    if (metadata.creator !== undefined) pdfDoc.setCreator(metadata.creator);
    if (metadata.producer !== undefined) pdfDoc.setProducer(metadata.producer);

    pdfDoc.setModificationDate(new Date());

    if (!metadata.producer) applyBranding(pdfDoc);

    return await pdfDoc.save();
}

/**
 * Flatten PDF forms
 */
export async function flattenPDF(file: File): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const form = pdfDoc.getForm();

    try {
        form.flatten();
    } catch {
        // No form fields to flatten
    }

    applyBranding(pdfDoc);
    return await pdfDoc.save();
}

/**
 * Repair PDF by rebuilding structure
 */
/**
 * Deep Repair using PDF.js rasterization
 * Renders pages to images and rebuilds a fresh PDF
 */
/**
 * Rasterize pages to images and re-embed them (Deep Compression/Repair)
 */
async function rasterizeAndCompressPDF(file: File, quality: number = 0.7, scale: number = 2.0): Promise<Uint8Array> {
    console.log(`Starting Rasterization: Quality=${quality}, Scale=${scale}`);

    const arrayBuffer = await file.arrayBuffer();
    // @ts-ignore
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    const newPdf = await PDFDocument.create();

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: scale });

        // Create offscreen canvas
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');

        if (!context) throw new Error('Failed to create canvas context');

        // Render
        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;

        // Convert to JPG blob with specific quality
        // JPEG is much better for compression than PNG
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
        if (!blob) continue;

        const imageBytes = await blob.arrayBuffer();
        const embeddedImage = await newPdf.embedJpg(imageBytes);

        const newPage = newPdf.addPage([viewport.width / scale, viewport.height / scale]);
        newPage.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: viewport.width / scale,
            height: viewport.height / scale,
        });

        // Cleanup
        canvas.remove();
    }

    applyBranding(newPdf);
    return await newPdf.save();
}

/**
 * Deep Repair using PDF.js rasterization
 * Renders pages to images and rebuilds a fresh PDF
 */
async function deepRepairPDF(file: File): Promise<Uint8Array> {
    console.log('Attempting Deep Repair (Rasterization)...');
    // High quality for repair (scale 2.0, quality 0.95)
    return await rasterizeAndCompressPDF(file, 0.95, 2.0);
}

/**
 * Repair PDF by rebuilding structure
 */
export async function repairPDF(file: File): Promise<Uint8Array> {
    let arrayBuffer = await file.arrayBuffer();

    // 1. Check for PDF header signature
    const headerParams = new Uint8Array(arrayBuffer.slice(0, 1024));
    const headerString = String.fromCharCode(...Array.from(headerParams));
    const pdfHeaderIndex = headerString.indexOf('%PDF-');

    if (pdfHeaderIndex === -1) {
        // Deep scan for header in first 50KB
        const deepScanLimit = Math.min(arrayBuffer.byteLength, 50 * 1024);
        const deepParams = new Uint8Array(arrayBuffer.slice(0, deepScanLimit));
        const deepString = String.fromCharCode(...Array.from(deepParams));
        const deepIndex = deepString.indexOf('%PDF-');

        if (deepIndex > 0) {
            console.log(`Found PDF header at offset ${deepIndex}. Trimming file...`);
            arrayBuffer = arrayBuffer.slice(deepIndex);
        } else {
            console.warn('No PDF header found in first 50KB. Attempting Deep Repair directly.');
            // If we can't find a header, PDF-Lib will definitely fail.
            // Try Deep Repair immediately if it looks vaguely like data, or fail?
            // PDF.js is also likely to fail without a header, but let's let the try/catch handle it.
            return await deepRepairPDF(file);
        }
    }

    try {
        const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

        // Just loading and saving often fixes structural issues
        applyBranding(pdf);
        const fixedPdfBytes = await pdf.save();
        return fixedPdfBytes;
    } catch (error) {
        console.warn('Standard repair failed. Attempting Deep Repair (Rasterization)...', error);
        return await deepRepairPDF(file);
    }
}

export async function setMetadata(
    file: File,
    metadata: { title?: string; author?: string; subject?: string; keywords?: string[] }
): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    if (metadata.title) pdfDoc.setTitle(metadata.title);
    if (metadata.author) pdfDoc.setAuthor(metadata.author);
    if (metadata.subject) pdfDoc.setSubject(metadata.subject);
    if (metadata.keywords) pdfDoc.setKeywords(metadata.keywords);

    applyBranding(pdfDoc);
    return await pdfDoc.save();
}

export async function reversePDF(file: File): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(arrayBuffer);
    const newPdf = await PDFDocument.create();

    const totalPages = sourcePdf.getPageCount();
    // Create array [N-1, N-2, ... 0]
    const reverseIndices = Array.from({ length: totalPages }, (_, i) => totalPages - 1 - i);

    const copiedPages = await newPdf.copyPages(sourcePdf, reverseIndices);
    copiedPages.forEach((page: any) => newPdf.addPage(page));

    applyBranding(newPdf);
    return await newPdf.save();
}

export async function extractPages(file: File, pageRange: string): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(arrayBuffer);
    const newPdf = await PDFDocument.create();
    const totalPages = sourcePdf.getPageCount();

    // Parse range string "1, 3-5, 8" -> 0-based indices
    const pageIndices = new Set<number>();
    const parts = pageRange.split(',').map(p => p.trim());

    for (const part of parts) {
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(n => parseInt(n));
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = start; i <= end; i++) {
                    if (i >= 1 && i <= totalPages) pageIndices.add(i - 1);
                }
            }
        } else {
            const pageNum = parseInt(part);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                pageIndices.add(pageNum - 1);
            }
        }
    }

    const indices = Array.from(pageIndices).sort((a, b) => a - b);
    if (indices.length === 0) throw new Error("Invalid page range");

    const copiedPages = await newPdf.copyPages(sourcePdf, indices);
    copiedPages.forEach((page: any) => newPdf.addPage(page));

    applyBranding(newPdf);
    return await newPdf.save();
}

export async function burstPDF(file: File): Promise<File[]> {
    const arrayBuffer = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(arrayBuffer);
    const totalPages = sourcePdf.getPageCount();
    const files: File[] = [];

    for (let i = 0; i < totalPages; i++) {
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(sourcePdf, [i]);
        newPdf.addPage(copiedPage);
        applyBranding(newPdf);
        const bytes = await newPdf.save();
        files.push(new File([bytes as any], `${file.name.replace('.pdf', '')}_page_${i + 1}.pdf`, { type: 'application/pdf' }));
    }

    return files;
}

export async function convertPDFToImages(file: File, format: 'png' | 'jpeg' = 'png'): Promise<File[]> {
    const arrayBuffer = await file.arrayBuffer();

    // Load PDF.js dynamically
    const pdfjsLib = await import('pdfjs-dist');
    if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    }

    // @ts-ignore
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    const files: File[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // High quality

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Failed to get canvas context');

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;

        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, `image/${format}`));
        if (blob) {
            files.push(new File([blob], `${file.name.replace('.pdf', '')}_page_${i}.${format === 'jpeg' ? 'jpg' : 'png'}`, { type: `image/${format}` }));
        }

        // Cleanup
        canvas.remove();
    }

    return files;
}
