
import { describe, it, expect, vi } from 'vitest';
import { executeWorkflow, WorkflowStep } from '@/lib/workflow-engine';

// Mock the pdf-utils used by strategies
vi.mock('@/lib/pdf-utils', () => ({
    mergePDFs: vi.fn().mockResolvedValue(new Uint8Array()),
    rotatePDF: vi.fn().mockResolvedValue(new Uint8Array()),
    compressPDF: vi.fn().mockResolvedValue(new Uint8Array()),
    protectPDF: vi.fn().mockResolvedValue(new Uint8Array()),
    addWatermark: vi.fn().mockResolvedValue(new Uint8Array()),
    addPageNumbers: vi.fn().mockResolvedValue(new Uint8Array()),
    setMetadata: vi.fn().mockResolvedValue(new Uint8Array()),
    reversePDF: vi.fn().mockResolvedValue(new Uint8Array()),
    extractPages: vi.fn().mockResolvedValue(new Uint8Array()),
    burstPDF: vi.fn().mockResolvedValue([]),
    convertPDFToImages: vi.fn().mockResolvedValue([]),
    applyBranding: vi.fn()
}));

describe('Workflow Engine', () => {
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });

    it('should execute a simple rotation workflow', async () => {
        const steps: WorkflowStep[] = [
            { id: '1', type: 'rotate', settings: { rotation: 90 } }
        ];

        const results = await executeWorkflow([mockFile], steps);
        expect(results.length).toBe(1);
        expect(results[0].name).toBe('test.pdf');
    });

    it('should execute a merge workflow', async () => {
        const steps: WorkflowStep[] = [
            { id: '1', type: 'merge', settings: { outputFilename: 'merged.pdf' } }
        ];

        const results = await executeWorkflow([mockFile, mockFile], steps);
        expect(results.length).toBe(1);
        expect(results[0].name).toBe('merged.pdf');
    });

    it('should handle multiple steps in sequence', async () => {
        const steps: WorkflowStep[] = [
            { id: '1', type: 'rotate', settings: { rotation: 90 } },
            { id: '2', type: 'compress', settings: { quality: 0.5 } }
        ];

        const results = await executeWorkflow([mockFile], steps);
        expect(results.length).toBe(1);
    });

    it('should throw error if step fails', async () => {
        const steps: WorkflowStep[] = [
            { id: '1', type: 'protect', settings: {} } // Missing password
        ];

        await expect(executeWorkflow([mockFile], steps)).rejects.toThrow('Step 1 (protect) failed');
    });
});
