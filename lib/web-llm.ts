/* eslint-disable */
import { CreateMLCEngine, MLCEngineInterface, InitProgressReport } from '@mlc-ai/web-llm';

export const SELECTED_MODEL = 'Phi-3-mini-4k-instruct-q4f16_1-MLC';
export const FALLBACK_MODEL = 'TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC';

let engine: MLCEngineInterface | null = null;
let currentModelId: string | null = null;

export async function getMLCEngine(
    onProgress?: (report: InitProgressReport) => void,
    modelId: string = SELECTED_MODEL
): Promise<MLCEngineInterface> {
    if (engine && currentModelId === modelId) return engine;

    // Discard old engine if model changed
    if (engine) {
        await engine.unload();
        engine = null;
    }

    engine = await CreateMLCEngine(modelId, {
        initProgressCallback: onProgress,
        appConfig: {
            model_list: [], // Uses default list
            useIndexedDBCache: false, // Deprecated in favor of Cache API? Check docs. 
            // Actually, WebLLM uses Cache API by default for weights. 
            // We explicitely enable it (though default is usually true).
        }
    });
    currentModelId = modelId;

    return engine;
}

export async function checkWebGPU(): Promise<{ supported: boolean; hasF16: boolean }> {
    if (typeof navigator === 'undefined' || !(navigator as any).gpu) {
        return { supported: false, hasF16: false };
    }
    try {
        const adapter = await (navigator as any).gpu.requestAdapter();
        if (!adapter) return { supported: false, hasF16: false };

        // Check for f16 support
        const hasF16 = adapter.features.has('shader-f16');
        return { supported: true, hasF16 };
    } catch (e) {
        return { supported: false, hasF16: false };
    }
}

export async function streamChatCompletion(
    messages: any[],
    onUpdate: (text: string) => void,
    modelId?: string
) {
    const engine = await getMLCEngine(undefined, modelId);
    const chunks = await engine.chat.completions.create({
        messages,
        stream: true,
    });

    let fullText = '';
    for await (const chunk of chunks) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullText += content;
        onUpdate(fullText);
    }

    return fullText;
}
