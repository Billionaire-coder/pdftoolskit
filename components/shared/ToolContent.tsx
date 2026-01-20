import { GlassCard } from '@/components/ui/GlassCard';
import { toolSeoContent } from '@/data/seo-content';
import { useTranslation } from 'react-i18next';

interface ToolContentProps {
    toolName: string;
}

export function ToolContent({ toolName }: ToolContentProps) {
    const { t, i18n } = useTranslation('seo');

    // Check if translation exists in the current language
    const hasTranslation = i18n.hasResourceBundle(i18n.language, 'seo') &&
        i18n.getResource(i18n.language, 'seo', toolName);

    const content = hasTranslation
        ? { title: t(`${toolName}.title`), htmlContext: t(`${toolName}.htmlContext`) }
        : toolSeoContent[toolName];

    if (!content) return null;

    return (
        <section className="mt-20 mb-12">
            <GlassCard className="p-8 lg:p-12 relative overflow-hidden" animate={false}>
                {/* Decoration Background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

                <div className="relative z-10 max-w-4xl mx-auto">
                    <h2 className="text-3xl font-heading font-bold text-slate-900 dark:text-white mb-8 border-b border-slate-200 dark:border-white/10 pb-4">
                        {content.title}
                    </h2>

                    <div
                        className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-heading prose-a:text-primary hover:prose-a:text-primary/80 transition-colors"
                        dangerouslySetInnerHTML={{ __html: content.htmlContext }}
                    />
                </div>
            </GlassCard>
        </section>
    );
}
