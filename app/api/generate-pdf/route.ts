import { NextResponse } from 'next/server';

import { checkSubscription } from '@/lib/server-gate';


export async function POST(request: Request) {
    const { isAuthorized, error, status } = await checkSubscription();
    if (!isAuthorized) {
        return NextResponse.json({ error }, { status });
    }

    try {
        const { url, format = 'a4', orientation = 'portrait', viewport = 'desktop', cleanShot = true } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        let targetUrl = url;
        // Ensure protocol
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = 'https://' + targetUrl;
        }

        // Validate URL
        try {
            new URL(targetUrl);
        } catch {
            return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
        }

        // Use Shared Generator Service (Phase 34)
        const { generatePdfBuffer } = await import('@/lib/services/pdf/generator');

        const pdfBuffer = await generatePdfBuffer({
            url: targetUrl,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            format: format as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            orientation: orientation as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            viewport: viewport as any,
            cleanShot: !!cleanShot,
            browserlessToken: process.env.BROWSERLESS_TOKEN
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const blob = new Blob([pdfBuffer as any], { type: 'application/pdf' });
        return new NextResponse(blob, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${new URL(targetUrl).hostname}.pdf"`,
                'Cache-Control': 'public, max-age=3600, immutable', // Cache for 1 hour
            },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('PDF Generation Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

