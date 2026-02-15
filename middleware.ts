import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { i18n } from './i18n-config';

// Simple match function to find best locale
function getLocale(request: NextRequest): string {
    // 1. Check cookie
    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
    if (cookieLocale && i18n.locales.includes(cookieLocale as any)) {
        return cookieLocale;
    }

    // 2. Check Accept-Language
    const acceptLanguage = request.headers.get('Accept-Language');
    if (acceptLanguage) {
        // Simple parse: "en-US,en;q=0.9,es;q=0.8" -> ["en-US", "en", "es"]
        const preferredLocales = acceptLanguage
            .split(',')
            .map(lang => lang.split(';')[0].trim());

        for (const lang of preferredLocales) {
            // Check exact match
            if (i18n.locales.includes(lang as any)) {
                return lang;
            }
            // Check base match (e.g. en-US -> en)
            const baseLang = lang.split('-')[0];
            if (i18n.locales.includes(baseLang as any)) {
                return baseLang;
            }
        }
    }

    return i18n.defaultLocale;
}

export async function middleware(req: NextRequest) {
    // 1. Rate Limiter for API Routes
    if (req.nextUrl.pathname.startsWith('/api')) {
        try {
            const { ratelimit } = await import('@/lib/ratelimit');
            const ip = req.ip ?? '127.0.0.1';
            const { success, pending, limit, reset, remaining } = await ratelimit.limit(ip);

            // Pending is a promise for analytics, we can let it run
            // await pending; 

            if (!success) {
                return NextResponse.json(
                    { error: 'Too Many Requests' },
                    {
                        status: 429,
                        headers: {
                            'X-RateLimit-Limit': limit.toString(),
                            'X-RateLimit-Remaining': remaining.toString(),
                            'X-RateLimit-Reset': reset.toString(),
                        }
                    }
                );
            }

            // Allow request to proceed
            return NextResponse.next();
        } catch (e) {
            console.error('Rate limit error:', e);
            // Fail open if Redis is down
            return NextResponse.next();
        }
    }

    // 2. Skip if internal paths (but NOT api anymore, as we just handled it)
    if (
        req.nextUrl.pathname.startsWith('/_next') ||
        req.nextUrl.pathname.startsWith('/static') ||
        req.nextUrl.pathname.includes('.') || // files
        req.nextUrl.pathname.startsWith('/worker')
    ) {
        return NextResponse.next();
    }

    // If it's an API route that passed rate limiting, accessing it via middleware might interfere 
    // with the route handler if we don't return next() or let it fall through.
    // The original code skipped API routes entirely from locale/auth checks.
    // We should keep skipping API routes for Locale logic.
    if (req.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    // 2. Check if path already has locale
    const pathname = req.nextUrl.pathname;
    const pathnameIsMissingLocale = i18n.locales.every(
        (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
    );

    // 3. Redirect if missing
    if (pathnameIsMissingLocale) {
        const locale = getLocale(req);

        // e.g. incoming request is /products
        // The new URL is now /en/products
        return NextResponse.redirect(
            new URL(
                `/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`,
                req.url
            )
        );
    }

    // 4. Auth Protection
    // Protect /admin routes
    if (req.nextUrl.pathname.includes('/admin')) {
        const token = await getToken({ req });
        const isAdmin = token?.role === 'admin';

        if (!isAdmin) {
            // Redirect to home if not admin
            // We can also redirect to signin, but blocking visibility is better
            const locale = getLocale(req);
            return NextResponse.redirect(new URL(`/${locale}`, req.url));
        }
    }

    const res = NextResponse.next();

    // 5. SEO: Pass pure path for hreflang generation
    // We need to strip the locale from the pathname to get the "canonical" path
    // e.g. /es/merge-pdf -> /merge-pdf
    let purePath = pathname;
    const pathLocale = i18n.locales.find(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    if (pathLocale) {
        purePath = pathname.replace(`/${pathLocale}`, '');
        if (purePath === '') purePath = '/'; // Handle root
    }

    res.headers.set('x-pure-path', purePath);

    // Security Headers
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return res;
}

export const config = {
    // Matcher excluding api, _next, etc is handled inside, but good to keep typical matcher
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)']
};
