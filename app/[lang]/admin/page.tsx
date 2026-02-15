'use client';

import React from 'react';
import { Users, FileText, CreditCard, TrendingUp } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

export default function AdminPage() {
    // Mock Data for Phase 25 visual verification
    const stats = [
        { name: 'Total Users', value: '12,345', change: '+12%', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { name: 'PDFs Processed', value: '843,291', change: '+23%', icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { name: 'Active Subscriptions', value: '1,203', change: '+5%', icon: CreditCard, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        { name: 'Revenue (MRR)', value: '$14,230', change: '+8%', icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Dashboard Overview</h1>
                <p className="text-slate-400">Welcome back, Admin. Here is what's happening today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <GlassCard key={stat.name} className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <span className="text-emerald-400 text-sm font-medium bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                                {stat.change}
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
                        <p className="text-slate-400 text-sm">{stat.name}</p>
                    </GlassCard>
                ))}
            </div>

            {/* Recent Activity Mock */}
            <GlassCard className="p-6">
                <h2 className="text-lg font-bold text-white mb-6">Recent Activity</h2>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-0">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold">
                                    U{i}
                                </div>
                                <div>
                                    <p className="text-white font-medium">User #{1000 + i} subscribed to Pro</p>
                                    <p className="text-slate-500 text-sm">{i * 2} minutes ago</p>
                                </div>
                            </div>
                            <span className="text-slate-400 text-sm">$12.00</span>
                        </div>
                    ))}
                </div>
            </GlassCard>
        </div>
    );
}
