
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
    params: Record<string, any>;
}

export interface WorkflowResult {
    pdfBytes: Uint8Array;
    logs: string[];
}

import {
    rotatePDF,
    flattenPDF,
    protectPDF,
    unlockPDF,
    addWatermark,
    addPageNumbers,
    getFileArrayBuffer,
    compressPDF
} from './pdf-utils';

export class WorkflowEngine {
    private logs: string[] = [];

    private log(message: string) {
        this.logs.push(`[${new Date().toISOString()}] ${message}`);
    }

    async execute(file: File, steps: WorkflowStep[]): Promise<WorkflowResult> {
        this.logs = [];
        this.log(`Starting workflow with ${steps.length} steps.`);

        // Extremely defensive buffer extraction for environment compatibility
        const arrayBuffer = await getFileArrayBuffer(file);
        let currentPdfBytes: Uint8Array = new Uint8Array(arrayBuffer);

        const currentFilename = file.name;

        for (let index = 0; index < steps.length; index++) {
            // eslint-disable-next-line security/detect-object-injection
            const step = steps[index];
            this.log(`Step ${index + 1}: Executing ${step.action}...`);

            // Create a File object for the current step
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const currentFile = new File([currentPdfBytes as any], currentFilename, { type: 'application/pdf' });

            try {
                switch (step.action) {
                    case 'watermark':
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        currentPdfBytes = await addWatermark(currentFile, step.params.text as string, step.params.options as any);
                        break;
                    case 'pageNumbers':
                        currentPdfBytes = await addPageNumbers(currentFile, {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            position: step.params.location as any,
                            startFrom: step.params.startNumber as number,
                            textPattern: step.params.textPattern as string,
                            margin: step.params.margin as number,
                            mirror: step.params.mirror as boolean
                        });
                        break;
                    case 'protect':
                        currentPdfBytes = await protectPDF(currentFile, {
                            userPassword: step.params.password as string,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            ...(step.params.settings as any)
                        });
                        break;
                    case 'unlock':
                        currentPdfBytes = await unlockPDF(currentFile, step.params.password as string);
                        break;
                    case 'compress':
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        currentPdfBytes = await compressPDF(currentFile, step.params.quality as any);
                        break;
                    case 'rotate':
                        currentPdfBytes = await rotatePDF(currentFile, step.params.rotation as 90 | 180 | 270);
                        break;
                    case 'flatten':
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        currentPdfBytes = await flattenPDF(currentFile, step.params.options as any);
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
            } catch (error: unknown) {
                this.log(`Error in step ${step.action}: ${error}`);
                throw new Error(`Error in step ${step.action}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }

        this.log('Workflow completed successfully.');
        return { pdfBytes: currentPdfBytes, logs: this.logs };
    }
}

export const workflowEngine = new WorkflowEngine();

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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const processedFile = new File([result.pdfBytes as any], file.name, { type: 'application/pdf', lastModified: Date.now() });
            results.push(processedFile);
        } catch (error) {
            console.error(`Failed to process file ${file.name}:`, error);
            throw error;
        }
    }

    if (onProgress) {
        onProgress(total, total, 'Completed');
    }

    return results;
}
