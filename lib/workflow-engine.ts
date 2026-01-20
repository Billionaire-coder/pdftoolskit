
import {
    mergePDFs,
    rotatePDF,
    compressPDF,
    protectPDF,
    addWatermark,
    addPageNumbers,
    setMetadata,
    reversePDF,
    extractPages,
    burstPDF,
    convertPDFToImages
} from './pdf-utils';

export type WorkflowActionType =
    | 'merge'
    | 'rotate'
    | 'compress'
    | 'protect'
    | 'watermark'
    | 'pageNumbers'
    | 'metadata'
    | 'reorder'
    | 'extract'
    | 'split'
    | 'pdfToImage';

export interface WorkflowStep {
    id: string;
    type: WorkflowActionType;
    settings: any;
}

export interface WorkflowStepResult {
    fileName: string;
    data: Uint8Array;
}

export type ProgressCallback = (stepIndex: number, totalSteps: number, status: string) => void;

/**
 * Executes a defined workflow on a given list of files.
 */
export async function executeWorkflow(
    files: File[],
    steps: WorkflowStep[],
    onProgress?: ProgressCallback
): Promise<File[]> {
    if (files.length === 0) throw new Error("No files provided");
    if (steps.length === 0) return files;

    let currentFiles = [...files];

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        if (onProgress) onProgress(i, steps.length, `Running ${step.type}...`);

        console.log(`[Workflow] Step ${i + 1}: ${step.type}`, step.settings);

        try {
            currentFiles = await processStep(currentFiles, step);
        } catch (error) {
            console.error(`[Workflow] Error in step ${step.type}:`, error);
            throw new Error(`Step ${i + 1} (${step.type}) failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    if (onProgress) onProgress(steps.length, steps.length, 'Completed');
    return currentFiles;
}

async function processStep(files: File[], step: WorkflowStep): Promise<File[]> {
    const { type, settings } = step;

    switch (type) {
        case 'merge':
            // Merge all files into one
            if (files.length < 2) return files; // Nothing to merge
            const mergedBytes = await mergePDFs(files);
            const defaultName = "merged_output.pdf";
            const fileName = settings.outputFilename
                ? (settings.outputFilename.endsWith('.pdf') ? settings.outputFilename : `${settings.outputFilename}.pdf`)
                : defaultName;

            const mergedFile = new File([mergedBytes as any], fileName, { type: "application/pdf" });
            return [mergedFile];

        case 'rotate':
            // Rotate each file
            return await Promise.all(files.map(async (file) => {
                const rotation = settings.rotation || 90; // 90, 180, 270
                const resultBytes = await rotatePDF(file, rotation);
                return new File([resultBytes as any], file.name, { type: file.type });
            }));

        case 'compress':
            // Compress each file
            return await Promise.all(files.map(async (file) => {
                const quality = settings.quality || 0.7;
                const resultBytes = await compressPDF(file, quality);
                return new File([resultBytes as any], file.name, { type: file.type });
            }));

        case 'protect':
            // Protect each file
            return await Promise.all(files.map(async (file) => {
                const { password } = settings;
                if (!password) throw new Error("Password required for protection");
                const resultBytes = await protectPDF(file, password);
                return new File([resultBytes as any], `protected_${file.name}`, { type: file.type });
            }));

        case 'watermark':
            // Watermark each file
            return await Promise.all(files.map(async (file) => {
                const { text, size, opacity, color } = settings;
                if (!text) throw new Error("Watermark text required");
                // Pass optional settings 
                const resultBytes = await addWatermark(file, text, { size, opacity, color });
                return new File([resultBytes as any], file.name, { type: file.type });
            }));

        case 'pageNumbers':
            // Add page numbers to each file
            return await Promise.all(files.map(async (file) => {
                const { position, startFrom, fontSize } = settings;
                const resultBytes = await addPageNumbers(file, { position, startFrom, fontSize });
                return new File([resultBytes as any], file.name, { type: file.type });
            }));

        case 'metadata':
            return await Promise.all(files.map(async (file) => {
                const { title, author, subject, keywords } = settings;
                const resultBytes = await setMetadata(file, { title, author, subject, keywords });
                return new File([resultBytes as any], file.name, { type: file.type });
            }));

        case 'reorder':
            return await Promise.all(files.map(async (file) => {
                // Currently only supporting 'reverse'
                if (settings.mode === 'reverse') {
                    const resultBytes = await reversePDF(file);
                    return new File([resultBytes as any], file.name, { type: file.type });
                }
                return file;
            }));

        case 'extract':
            return await Promise.all(files.map(async (file) => {
                const { pageRange } = settings;
                if (!pageRange) throw new Error("Page range required for extraction");
                const resultBytes = await extractPages(file, pageRange);
                return new File([resultBytes as any], `extracted_${file.name}`, { type: file.type });
            }));

        case 'split':
            // Result of split is multiple files per input file. Flatten the result.
            const splitResults = await Promise.all(files.map(async (file) => {
                return await burstPDF(file);
            }));
            return splitResults.flat();

        case 'pdfToImage':
            const imageResults = await Promise.all(files.map(async (file) => {
                const format = settings.format || 'png';
                return await convertPDFToImages(file, format);
            }));
            return imageResults.flat();

        default:
            console.warn(`Unknown step type: ${type}`);
            return files;
    }
}
