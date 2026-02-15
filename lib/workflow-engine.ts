/* eslint-disable */
import { WORKFLOW_STRATEGIES } from './workflow/strategies';

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
    const strategy = WORKFLOW_STRATEGIES[type];

    if (!strategy) {
        console.warn(`Unknown step type: ${type}`);
        return files;
    }

    return await strategy.execute(files, settings);
}
