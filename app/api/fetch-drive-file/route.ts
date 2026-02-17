
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { url, token } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const headers: HeadersInit = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch from Drive: ${response.statusText}` },
                { status: response.status }
            );
        }

        // Stream the response body directly instead of buffering in memory
        // This prevents OOM errors with large files
        return new NextResponse(response.body, {
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
                'Content-Length': response.headers.get('Content-Length') || '',
            },
        });

    } catch (error: any) {
        console.error('Drive fetch error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
