import { TextItemWithCoords } from '@/lib/pdf-text-extractor';

export interface Chunk {
    text: string;
    pageIndex: number;
    score?: number;
}

export const CHUNK_SIZE = 1200; // Characters
export const CHUNK_OVERLAP = 200;

/**
 * Splits extracted text items into manageable chunks for the LLM.
 */
export function extractChunks(textItems: TextItemWithCoords[]): Chunk[] {
    const chunks: Chunk[] = [];
    let currentText = '';
    let currentPageIndex = 0;

    // Group text by page first to maintain structural context
    const pages: { index: number; text: string }[] = [];
    textItems.forEach((item) => {
        if (!pages[item.pageIndex]) {
            pages[item.pageIndex] = { index: item.pageIndex, text: '' };
        }
        pages[item.pageIndex].text += item.str + ' ';
    });

    pages.forEach((page) => {
        const text = page.text;
        if (!text) return;

        if (text.length <= CHUNK_SIZE) {
            chunks.push({ text, pageIndex: page.index });
        } else {
            // Split long page into overlapping chunks
            for (let i = 0; i < text.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
                const chunkText = text.slice(i, i + CHUNK_SIZE).trim();
                if (chunkText.length > 50) { // Ignore tiny fragments
                    chunks.push({ text: chunkText, pageIndex: page.index });
                }
            }
        }
    });

    return chunks;
}

export function getRelevantContext(query: string, chunks: Chunk[], topN: number = 4): Chunk[] {
    const queryTokens = query.toLowerCase().split(/\W+/).filter(k => k.length > 2);
    if (queryTokens.length === 0) return chunks.slice(0, topN);

    // TF-IDF inspired simplified scoring
    const totalDocs = chunks.length;
    const termDocCounts: Record<string, number> = {};

    queryTokens.forEach(token => {
        termDocCounts[token] = chunks.filter(c => c.text.toLowerCase().includes(token)).length;
    });

    const scoredChunks = chunks.map(chunk => {
        const lowerText = chunk.text.toLowerCase();
        let score = 0;

        queryTokens.forEach(token => {
            const tf = (lowerText.match(new RegExp(token, 'g')) || []).length;
            if (tf > 0) {
                // IDF approximation: log(total/docCount)
                const docCount = termDocCounts[token] || 1;
                const idf = Math.log(totalDocs / docCount) + 1;
                score += tf * idf;

                // Big boost for exact phrase or proximity
                if (lowerText.includes(token)) score += 10;
            }
        });

        // Boost for chunks near the beginning (often more relevant in documents)
        score += (1 / (chunk.pageIndex + 1)) * 5;

        return { ...chunk, score };
    });

    return scoredChunks
        .filter(c => (c.score || 0) > 0)
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, topN);
}

/**
 * Constructs the system prompt for the Semantic RAG task.
 */
export function buildRAGPrompt(query: string, relevantChunks: Chunk[]): string {
    const context = relevantChunks
        .map((c, i) => `[[Source ${i + 1} | Page ${c.pageIndex + 1}]]: ${c.text}`)
        .join('\n\n');

    return `You are the PDF Intelligence Engine, a sophisticated research assistant.
Use the provided document context to answer the user's query with extreme precision.

--- RESEARCH DATA ---
${context}
--- DATA END ---

User Query: ${query}

Response Protocol:
1. Use markdown for structure (bolding, lists).
2. For EVERY claim, you MUST cite the source using the format [Source N]. 
3. If the context does not contain the answer, state that "No relevant data was found in the analyzed segments."
4. Maintain a professional, analytical tone.
5. Be concise but thorough.

STRICT RULE: Do NOT use any knowledge outside of the provided context.`;
}
