'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, CreditCard, Settings, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function AdminLayout({
    children,
    params: { lang },
}: {
    children: React.ReactNode;
    params: { lang: string };
}) {
    const pathname = usePathname();

    const navigation = [
        { name: 'Overview', href: `/${lang}/admin`, icon: LayoutDashboard },
        { name: 'Users', href: `/${lang}/admin/users`, icon: Users }, // Placeholder
        { name: 'Subscriptions', href: `/${lang}/admin/subscriptions`, icon: CreditCard }, // Placeholder
        { name: 'Settings', href: `/${lang}/admin/settings`, icon: Settings }, // Placeholder
    ];

    return (
        <div className="min-h-screen bg-slate-900 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-800 border-r border-slate-700 hidden md:flex flex-col">
                <div className="p-6">
                    <h1 className="text-xl font-bold text-white tracking-tight">
                        <span className="text-emerald-400">PDF</span>Toolkit Admin
                    </h1>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'bg-emerald-500/10 text-emerald-400'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <button
                        onClick={() => signOut({ callbackUrl: `/${lang}` })}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
