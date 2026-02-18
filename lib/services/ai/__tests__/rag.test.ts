import { describe, it, expect } from 'vitest';
import { extractChunks, getRelevantContext, Chunk } from '../rag';
import { TextItemWithCoords } from '@/lib/pdf-text-extractor';

describe('RAG Service', () => {
    const mockTextItems: TextItemWithCoords[] = [
        { str: 'Hello world', x: 0, y: 0, width: 10, height: 10, pageIndex: 0, fontName: 'Arial', fontSize: 12 },
        { str: 'This is a test of the RAG system.', x: 0, y: 0, width: 10, height: 10, pageIndex: 0, fontName: 'Arial', fontSize: 12 },
        { str: 'DeepMind is an AI research lab.', x: 0, y: 0, width: 10, height: 10, pageIndex: 1, fontName: 'Arial', fontSize: 12 },
    ];

    it('should extract chunks correctly', () => {
        const chunks = extractChunks(mockTextItems);
        expect(chunks.length).toBeGreaterThan(0);
        expect(chunks[0].text).toContain('Hello world');
        expect(chunks[1].pageIndex).toBe(1);
    });

    it('should retrieve relevant context based on keywords', () => {
        const chunks = extractChunks(mockTextItems);
        const query = 'Tell me about DeepMind';
        const relevant = getRelevantContext(query, chunks);

        expect(relevant.length).toBe(1);
        expect(relevant[0].text).toContain('DeepMind');
        expect(relevant[0].pageIndex).toBe(1);
    });

    it('should return top N chunks', () => {
        const chunks: Chunk[] = [
            { text: 'apple banana', pageIndex: 0 },
            { text: 'banana cherry', pageIndex: 1 },
            { text: 'cherry date', pageIndex: 2 }
        ];
        const relevant = getRelevantContext('banana', chunks, 1);
        expect(relevant.length).toBe(1);
        expect(relevant[0].text).toContain('banana');
    });
});
