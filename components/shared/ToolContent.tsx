import { GlassCard } from '@/components/ui/GlassCard';
import { toolSeoContent } from '@/data/seo-content';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';


interface ToolContentProps {
    toolName: string;
}

function cleanHtmlContent(html: string) {
    if (!html) return '';

    let cleaned = html.trim();
    let wasWrapped = false;

    // 1. Remove outer div wrapper if it's there
    if (cleaned.startsWith('<div') && (cleaned.endsWith('</div>') || cleaned.includes('</div>'))) {
        const firstCloseTag = cleaned.indexOf('>');
        const lastOpenTag = cleaned.lastIndexOf('</div');
        if (firstCloseTag !== -1 && lastOpenTag !== -1 && lastOpenTag > firstCloseTag) {
            cleaned = cleaned.substring(firstCloseTag + 1, lastOpenTag);
            wasWrapped = true;
        }
    }

    // 2. Unindent lines robustly
    const lines = cleaned.split('\n');

    // Find minimum indentation across all non-blank lines
    const nonBlankLines = lines.filter(line => line.trim().length > 0);
    if (nonBlankLines.length === 0) return cleaned.trim();

    const minIndent = nonBlankLines.reduce((min, line) => {
        const match = line.match(/^(\s*)/);
        const indent = match ? match[0].length : 0;
        return Math.min(min, indent);
    }, Infinity);

    if (minIndent !== Infinity && minIndent > 0) {
        cleaned = lines
            .map(line => line.length >= minIndent ? line.substring(minIndent) : line.trimStart())
            .join('\n');
    }

    // 3. If it was wrapped in a div (likely localized HTML), trim each line to prevent Markdown code blocks
    if (wasWrapped) {
        cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');
    }

    return cleaned.trim();
}

export function ToolContent({ toolName }: ToolContentProps) {
    const { t, i18n } = useTranslation('seo');

    // Check if translation exists in the current language
    const hasTranslation = i18n.hasResourceBundle(i18n.language, 'seo') &&
        i18n.getResource(i18n.language, 'seo', toolName);

    const rawContent = hasTranslation
        ? { title: t(`${toolName}.title`), htmlContext: t(`${toolName}.htmlContext`) }
        : toolSeoContent[toolName];

    if (!rawContent) return null;

    const content = {
        ...rawContent,
        htmlContext: cleanHtmlContent(rawContent.htmlContext)
    };

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

                    <div className="space-y-6 text-slate-600 dark:text-slate-300">
                        <ReactMarkdown
                            rehypePlugins={[rehypeRaw]}
                            components={{
                                h3: ({ node, ...props }) => <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4" {...props} />,
                                p: ({ node, ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc list-inside ml-4 space-y-2 mb-6" {...props} />,
                                li: ({ node, ...props }) => <li className="marker:text-primary" {...props} />,
                                a: ({ node, ...props }) => <a className="text-primary hover:underline font-medium transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                                strong: ({ node, ...props }) => <strong className="font-bold text-slate-700 dark:text-slate-200" {...props} />,
                                em: ({ node, ...props }) => <em className="italic text-slate-500 dark:text-slate-400" {...props} />,
                            }}
                        >
                            {content.htmlContext}
                        </ReactMarkdown>
                    </div>
                </div>

            </GlassCard>
        </section>
    );
}
