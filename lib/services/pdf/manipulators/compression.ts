import { OptimizationService } from '../OptimizationService';

/**
 * Standard PDF compression via object streams and metadata removal
 */
export async function compressPDF(
    file: File,
    quality: number = 0.7,
    targetSizeBytes?: number
): Promise<Uint8Array> {
    return OptimizationService.optimize(file, {
        quality,
        targetSizeBytes
    });
}

/**
 * Aggressive compression by rasterizing pages to JPEGs
 */
export async function rasterizeAndCompressPDF(
    file: File,
    quality: number = 0.7,
    scale: number = 2.0
): Promise<Uint8Array> {
    // Note: rasterize is private in OptimizationService, 
    // but the optimize method handles it or we can expose it if needed.
    // For compatibility with existing callers who specifically want rasterization:
    return OptimizationService.optimize(file, {
        quality,
        scale,
        targetSizeBytes: undefined // Force single pass optimization
    });
}
