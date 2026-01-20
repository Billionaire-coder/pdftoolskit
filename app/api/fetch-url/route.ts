import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Validate URL
        try {
            new URL(url);
        } catch {
            return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
        }

        // Fetch the external URL server-side
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            },
        });

        if (!response.ok) {
            return NextResponse.json({ error: `Failed to fetch URL: ${response.statusText}` }, { status: response.status });
        }

        let html = await response.text();

        // Resolve all relative URLs to absolute
        const baseUrl = new URL(url).origin;

        // Simple regex-based replacement for common attributes
        // Replaces href="/..." src="/..." etc.
        // This is a basic implementation. For production, a proper HTML parser (like cheerio) is recommended.

        // 1. Handle root-relative paths (starting with /)
        html = html.replace(/(href|src|action)="\//g, `$1="${baseUrl}/`);
        html = html.replace(/(href|src|action)='\//g, `$1='${baseUrl}/`);

        // 2. Handle protocol-relative paths (starting with //)
        html = html.replace(/(href|src|action)="\/\//g, `$1="https://`);
        html = html.replace(/(href|src|action)='\/\//g, `$1='https://`);

        // 3. Inject <base> tag as a fallback for any missed relative paths
        // We inject it right after <head> or at the start if missing
        if (html.includes('<head>')) {
            html = html.replace('<head>', `<head><base href="${url}" />`);
        } else {
            html = `<base href="${url}" />` + html;
        }

        return NextResponse.json({ html });

    } catch (error) {
        console.error('Proxy fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
