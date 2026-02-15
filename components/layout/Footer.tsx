'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Lucide } from '@/lib/lucide-registry';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTranslation } from 'react-i18next';

export function Footer() {
    const { t } = useTranslation('common');
    const [mounted, setMounted] = useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const currentYear = new Date().getFullYear();
    const [email, setEmail] = useState('');
    const [isValid, setIsValid] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setEmail(val);
        // Simple regex for email validation
        setIsValid(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        setIsSubmitted(true);
        // Reset after 2 seconds
        setTimeout(() => {
            setIsSubmitted(false);
            setEmail('');
            setIsValid(false);
        }, 2000);
    };

    return (
        <footer className="mt-24 mb-8">
            <GlassCard className="mx-4 lg:mx-8 p-8 lg:p-12" animate={false}>
                <div className="flex flex-col items-center gap-12">

                    {/* TOP: Centered Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <img
                            src="/favicon.png"
                            alt="PDFToolskit Logo"
                            className="h-10 w-10 object-contain"
                        />
                        <span className="text-2xl font-heading font-bold gradient-text">
                            PDFToolskit
                        </span>
                    </Link>

                    {/* MIDDLE: Split Content */}
                    <div className="w-full flex flex-col lg:flex-row gap-8 justify-center items-stretch">
                        {/* LEFT SIDE (Newsletter | Links) */}
                        <div className="flex-1 flex flex-col-reverse lg:flex-row gap-8 lg:gap-16 justify-end items-center">

                            {/* Left's Left: Newsletter */}
                            <div className="flex flex-col items-center lg:items-end gap-3 w-full max-w-xs min-h-[100px] justify-center">
                                {isSubmitted ? (
                                    <div className="animate-in fade-in zoom-in duration-300">
                                        <p className="text-xl font-heading font-bold gradient-text">Thank You ❤️</p>
                                    </div>
                                ) : (
                                    <>
                                        <h4 className="font-heading font-semibold text-slate-900 dark:text-white text-center lg:text-end w-full">
                                            {t('footer.newsletterTitle')}
                                        </h4>
                                        <form className="flex flex-col sm:flex-row w-full gap-2" onSubmit={handleSubmit}>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={handleEmailChange}
                                                placeholder={t('footer.newsletterPlaceholder')}
                                                className="flex-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 px-4 py-2 text-sm outline-none focus:border-primary transition-colors text-slate-900 dark:text-white placeholder:text-slate-400"
                                                required
                                            />
                                            <button
                                                type="submit"
                                                disabled={!isValid}
                                                className={`rounded-lg bg-gradient-primary px-4 py-2 text-sm font-semibold text-white transition-all min-w-[100px] ${isValid
                                                    ? 'hover:shadow-lg hover:shadow-primary/20 opacity-100'
                                                    : 'opacity-50 cursor-not-allowed grayscale'
                                                    }`}
                                            >
                                                {t('footer.newsletterSubmit')}
                                            </button>
                                        </form>
                                    </>
                                )}
                            </div>

                            {/* Left's Right: Links (1 Column) */}
                            <div className="flex flex-col gap-3 text-center lg:text-end items-center lg:items-end min-w-max">
                                <Link
                                    href="/blog"
                                    className="font-heading font-semibold text-base text-slate-900 dark:text-white hover:text-primary transition-colors"
                                >
                                    Blog
                                </Link>
                                <Link
                                    href="/pricing"
                                    className="font-heading font-semibold text-base text-slate-900 dark:text-white hover:text-primary transition-colors"
                                >
                                    Pricing
                                </Link>
                                <Link
                                    href="/privacy"
                                    className="font-heading font-semibold text-base text-slate-900 dark:text-white hover:text-primary transition-colors"
                                >
                                    Privacy Policy
                                </Link>
                                <Link
                                    href="/contact"
                                    className="font-heading font-semibold text-base text-slate-900 dark:text-white hover:text-primary transition-colors"
                                >
                                    Contact Us
                                </Link>
                                <Link
                                    href="/faq"
                                    className="font-heading font-semibold text-base text-slate-900 dark:text-white hover:text-primary transition-colors"
                                >
                                    FAQ
                                </Link>
                            </div>
                        </div>

                        {/* CENTER LINE (Vertical Divider) */}
                        <div className="hidden lg:block w-px bg-slate-200 dark:bg-white/10 my-2"></div>

                        {/* RIGHT SIDE (Socials & Credits) */}
                        <div className="flex-1 flex flex-col justify-center items-center lg:items-start gap-6 text-center lg:text-start ps-0 lg:ps-4">

                            {/* Social Icons */}
                            <div className="flex items-center gap-4">
                                <a
                                    href="https://billionaire-coder.github.io/Its-Me/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                >
                                    <Lucide.Github className="h-5 w-5" />
                                </a>
                                <a
                                    href="https://www.instagram.com/billionaire.saif/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                >
                                    <Lucide.Instagram className="h-5 w-5" />
                                </a>
                                <a
                                    href="https://x.com/billionairesaif"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                >
                                    <Lucide.Twitter className="h-5 w-5" />
                                </a>
                                <a
                                    href="mailto:saifnaimuddinqadri@gmail.com"
                                    className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                >
                                    <Lucide.Mail className="h-5 w-5" />
                                </a>
                            </div>

                            {/* Usage Credits */}
                            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 transition-all duration-300 hover:text-slate-900 dark:hover:text-white hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.6)] cursor-default select-none">
                                {mounted ? t('footer.builtBy') : 'Built with ❤️ by Saif Qadri for everyone.'}
                            </p>
                        </div>
                    </div>

                    {/* BOTTOM: Centered Copyright */}
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                        {t('footer.copyright', { year: currentYear })}
                    </p>
                </div>
            </GlassCard>
        </footer >
    );
}

