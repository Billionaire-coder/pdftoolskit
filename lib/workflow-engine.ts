// import { PDFDocument } from 'pdf-lib';
import { addWatermark, addPageNumbers } from './services/pdf/manipulators/enrichment';
import { compressPDF } from './services/pdf/manipulators/compression';
import { protectPDF, unlockPDF } from './services/pdf/security';
import { rotatePDF } from './services/pdf/manipulators/organization';
import { flattenPDF } from './services/pdf/manipulators/basic';

export type WorkflowAction =
    | 'watermark'
    | 'pageNumbers'
    | 'protect'
    | 'unlock'
    | 'compress'
    | 'rotate'
    | 'flatten'
    | 'merge'
    | 'reorder'
    | 'metadata'
    | 'extract'
    | 'split'
    | 'pdfToImage';

export interface WorkflowStep {
    id: string;
    action: WorkflowAction;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params: any;
}

export interface WorkflowResult {
    pdfBytes: Uint8Array;
    logs: string[];
}

export class WorkflowEngine {
    private logs: string[] = [];

    private log(message: string) {
        this.logs.push(`[${new Date().toISOString()}] ${message}`);
    }

    async execute(file: File, steps: WorkflowStep[]): Promise<WorkflowResult> {
        this.logs = [];
        this.log(`Starting workflow with ${steps.length} steps.`);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let currentPdfBytes: any = new Uint8Array(await file.arrayBuffer());
        // For tools that need a File object, we might need to reconstruct it?
        // Most tools in this codebase take `File`. 
        // We should construct a File from the bytes for each step if the tool requires it,
        // OR refactor tools to accept `Uint8Array`.
        // Refactoring is cleaner but risky.
        // Creating a File object is safer for compatibility.

        const currentFilename = file.name;

        for (let index = 0; index < steps.length; index++) {
            // eslint-disable-next-line security/detect-object-injection
            const step = steps[index];
            this.log(`Step ${index + 1}: Executing ${step.action}...`);

            // Create a File object for the current step
            const currentFile = new File([currentPdfBytes], currentFilename, { type: 'application/pdf' });

            try {
                switch (step.action) {
                    case 'watermark':
                        currentPdfBytes = await addWatermark(currentFile, step.params.text, step.params.options);
                        break;
                    case 'pageNumbers':
                        currentPdfBytes = await addPageNumbers(currentFile, {
                            position: step.params.location,
                            startFrom: step.params.startNumber,
                            textPattern: step.params.textPattern,
                            margin: step.params.margin,
                            mirror: step.params.mirror
                        });
                        break;
                    case 'protect':
                        // protectPDF(file, options)
                        currentPdfBytes = await protectPDF(currentFile, {
                            userPassword: step.params.password,
                            ...step.params.settings
                        });
                        break;
                    case 'unlock':
                        // unlockPDF(file, password)
                        currentPdfBytes = await unlockPDF(currentFile, step.params.password);
                        break;
                    case 'compress':
                        // compressPDF(file, quality)
                        currentPdfBytes = await compressPDF(currentFile, step.params.quality);
                        break;
                    case 'rotate':
                        // rotatePDF(file, rotation)
                        currentPdfBytes = await rotatePDF(currentFile, step.params.rotation as 90 | 180 | 270);
                        break;
                    case 'flatten':
                        // flattenPDF(file, options)
                        currentPdfBytes = await flattenPDF(currentFile, step.params.options);
                        break;
                    case 'merge':
                    case 'reorder':
                    case 'metadata':
                    case 'extract':
                    case 'split':
                    case 'pdfToImage':
                        this.log(`Action ${step.action} is not yet implemented in the engine.`);
                        break;
                    default:
                        this.log(`Unknown action: ${step.action}`);
                }
            } catch (error) {
                this.log(`Error in step ${step.action}: ${error}`);
                throw error;
            }
        }

        this.log('Workflow completed successfully.');
        return { pdfBytes: currentPdfBytes, logs: this.logs };
    }
}

export const workflowEngine = new WorkflowEngine();

/**
 * Batch processes files through the workflow engine.
 * Used by the job queue to handle multiple files and report progress.
 */
export async function executeWorkflow(
    files: File[],
    steps: WorkflowStep[],
    onProgress?: (current: number, total: number, status: string) => void
): Promise<File[]> {
    const results: File[] = [];
    const total = files.length;

    for (let i = 0; i < total; i++) {
        // eslint-disable-next-line security/detect-object-injection
        const file = files[i];

        if (onProgress) {
            onProgress(i, total, `Processing ${file.name}...`);
        }

        try {
            const result = await workflowEngine.execute(file, steps);

            // Create a File from the result bytes
            // We reuse the original filename, effectively modifying it "in place" for the next step or output
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const processedFile = new File([result.pdfBytes as any], file.name, { type: 'application/pdf', lastModified: Date.now() });
            results.push(processedFile);

        } catch (error) {
            console.error(`Failed to process file ${file.name}:`, error);
            // We might want to throw here or continue with partial results?
            // For now, let's throw to fail the job if a file fails
            throw error;
        }
    }

    if (onProgress) {
        onProgress(total, total, 'Completed');
    }

    return results;
}
