'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';

if (typeof window !== 'undefined') {
    const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

    if (POSTHOG_KEY) {
        posthog.init(POSTHOG_KEY, {
            api_host: POSTHOG_HOST,
            person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
            capture_pageview: false, // Disable automatic pageview capture, as we capture manually
        });
    }
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    return <PHProvider client={posthog}>{children}</PHProvider>;
}
