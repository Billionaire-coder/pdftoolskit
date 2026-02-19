import { GlassCard } from '@/components/ui/GlassCard';
import { useTranslation } from 'react-i18next';


interface QuickGuideProps {
    steps: {
        title: string;
        description: string;
    }[];
}

export function QuickGuide({ steps }: QuickGuideProps) {
    const { t } = useTranslation('common');
    return (
        <section className="py-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 text-center">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                    {t('toolPages.common.howToUse')}
                </span>
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
                {steps.map((step, index) => (
                    <GlassCard key={index} className="p-6 relative group hover:border-blue-500/30 transition-colors">
                        <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                            {index + 1}
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 mt-2">{step.title}</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{step.description}</p>
                    </GlassCard>
                ))}
            </div>
        </section>
    );
}
