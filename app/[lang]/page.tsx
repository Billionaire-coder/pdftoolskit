import { Hero } from '@/components/home/Hero';
import { ToolsGrid } from '@/components/home/ToolsGrid';
import { Features } from '@/components/home/Features';
// import { AdSense } from '@/components/shared/AdSense';

import { i18n } from '@/i18n-config';

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }));
}

export default function Home({ params }: { params: { lang: string } }) {
    return (
        <>
            <Hero />
            {/* <div className="container mx-auto px-4">
                <AdSense slot="home-after-hero" className="max-w-4xl mx-auto" />
            </div> */}
            <ToolsGrid />
            {/* <div className="container mx-auto px-4">
                <AdSense slot="home-after-tools" className="max-w-4xl mx-auto" />
            </div> */}
            <Features />
        </>
    );
}
