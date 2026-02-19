import { NextResponse } from 'next/server';
import dns from 'node:dns/promises';
import net from 'node:net';

function isPrivateIP(ip: string): boolean {
    if (!net.isIP(ip)) return false;

    // IPv4 Private Ranges
    if (net.isIPv4(ip)) {
        const parts = ip.split('.').map(Number);
        // 127.0.0.0/8 (Loopback)
        if (parts[0] === 127) return true;
        // 10.0.0.0/8 (Private)
        if (parts[0] === 10) return true;
        // 172.16.0.0/12 (Private)
        if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
        // 192.168.0.0/16 (Private)
        if (parts[0] === 192 && parts[1] === 168) return true;
        // 169.254.0.0/16 (Link-Local)
        if (parts[0] === 169 && parts[1] === 254) return true;
        // 0.0.0.0/8 (Current network)
        if (parts[0] === 0) return true;
    }

    // IPv6 Private Ranges
    if (net.isIPv6(ip)) {
        // ::1 (Loopback)
        if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') return true;
        // fc00::/7 (Unique Local) - checking 'f' followed by 'c' or 'd'
        const firstBlock = ip.split(':')[0].toLowerCase();
        if (firstBlock.startsWith('fc') || firstBlock.startsWith('fd')) return true;
        // fe80::/10 (Link-Local)
        if (firstBlock.startsWith('fe8') || firstBlock.startsWith('fe9') || firstBlock.startsWith('fea') || firstBlock.startsWith('feb')) return true;
    }

    return false;
}

export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Validate URL format
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(url);
            if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
                return NextResponse.json({ error: 'Only HTTP/HTTPS protocols are allowed' }, { status: 400 });
            }
        } catch {
            return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
        }

        // SSRF PROTECTION: DNS Resolution & IP Check
        try {
            const hostname = parsedUrl.hostname;
            // Lookup the IP address of the hostname
            const lookup = await dns.lookup(hostname);
            const ip = lookup.address;

            if (isPrivateIP(ip)) {
                console.warn(`[Security] Blocked SSRF attempt to private IP: ${hostname} -> ${ip}`);
                return NextResponse.json({ error: 'Access to private resources is forbidden' }, { status: 403 });
            }
        } catch (dnsError) {
            console.error('DNS Lookup failed:', dnsError);
            return NextResponse.json({ error: 'Failed to resolve hostname' }, { status: 400 });
        }

        // Fetch the external URL server-side
        // Note: There is still a race condition (DNS Rebinding) possible here if the attacker controls the DNS server.
        // A robust solution requires a custom http agent that checks the IP *after* connection, but that is complex in standard fetch.
        // This resolution check prevents 99% of accidental or low-effort SSRF.
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Apache-HttpClient/4.5.13 (Java/1.8.0_292)', // Generic UA
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            },
            // Prevent following redirects to private IPs (fetch follows transparently, which is risky)
            redirect: 'error',
        });

        if (!response.ok) {
            // Check for redirect manually if needed, or just fail for now to be safe
            if (response.status >= 300 && response.status < 400) {
                return NextResponse.json({ error: 'Redirects are currently disabled for security' }, { status: 400 });
            }
            return NextResponse.json({ error: `Failed to fetch URL: ${response.statusText}` }, { status: response.status });
        }

        let html = await response.text();

        // Resolve all relative URLs to absolute
        const baseUrl = parsedUrl.origin;

        // Simple regex-based replacement for common attributes
        // Replaces href="/..." src="/..." etc.

        // 1. Handle root-relative paths (starting with /)
        html = html.replace(/(href|src|action)="\//g, `$1="${baseUrl}/`);
        html = html.replace(/(href|src|action)='\//g, `$1='${baseUrl}/`);

        // 2. Handle protocol-relative paths (starting with //)
        html = html.replace(/(href|src|action)="\/\//g, `$1="https://`);
        html = html.replace(/(href|src|action)='\/\//g, `$1='https://`);

        // 3. Inject <base> tag as a fallback for any missed relative paths
        if (html.includes('<head>')) {
            html = html.replace('<head>', `<head><base href="${url}" />`);
        } else {
            html = `<base href="${url}" />` + html;
        }

        return NextResponse.json({ html });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Proxy fetch error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

