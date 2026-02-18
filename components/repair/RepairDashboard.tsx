import React from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, Activity, Zap } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { HealthReport } from '@/lib/services/pdf/manipulators/repair';

interface RepairDashboardProps {
    report: HealthReport;
    className?: string;
}

export function RepairDashboard({ report, className }: RepairDashboardProps) {
    const getStatusColor = (score: number) => {
        if (score >= 90) return 'text-emerald-400';
        if (score >= 70) return 'text-yellow-400';
        return 'text-rose-400';
    };

    const getStatusBg = (score: number) => {
        if (score >= 90) return 'bg-emerald-500/10 border-emerald-500/20';
        if (score >= 70) return 'bg-yellow-500/10 border-yellow-500/20';
        return 'bg-rose-500/10 border-rose-500/20';
    };

    return (
        <div className={cn("space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700", className)}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Integrity Score */}
                <GlassCard className={cn("p-4 flex flex-col items-center justify-center text-center", getStatusBg(report.integrityScore))}>
                    <Activity className={cn("w-6 h-6 mb-2", getStatusColor(report.integrityScore))} />
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Integrity Score</span>
                    <span className={cn("text-3xl font-black tabular-nums", getStatusColor(report.integrityScore))}>
                        {report.integrityScore}%
                    </span>
                </GlassCard>

                {/* Primary Action Taken */}
                <GlassCard className="p-4 flex flex-col items-center justify-center text-center border-blue-500/20 bg-blue-500/5">
                    <Zap className="w-6 h-6 mb-2 text-blue-400" />
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Primary Fix</span>
                    <span className="text-sm font-semibold text-white truncate w-full px-2">
                        {report.fallbackUsed ? 'Visual Reconstruction' : 'Structural Splice'}
                    </span>
                </GlassCard>

                {/* Status Badge */}
                <GlassCard className="p-4 flex flex-col items-center justify-center text-center border-purple-500/20 bg-purple-500/5">
                    <ShieldCheck className="w-6 h-6 mb-2 text-purple-400" />
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Security Level</span>
                    <span className="text-sm font-semibold text-white">Healed & Verified</span>
                </GlassCard>
            </div>

            {/* Detailed Log */}
            <GlassCard className="p-5 border-white/5">
                <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Heal Execution Log</h4>
                </div>
                <div className="space-y-3">
                    {report.issuesFixed.map((issue, idx) => (
                        <div key={idx} className="flex items-start gap-3 group">
                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500/50 group-hover:bg-emerald-500 transition-colors shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{issue}</span>
                        </div>
                    ))}
                    {report.issuesFixed.length === 0 && (
                        <div className="flex items-center gap-3 text-slate-500 italic text-sm">
                            <AlertCircle className="w-4 h-4" />
                            <span>No major structural anomalies detected during heal.</span>
                        </div>
                    )}
                </div>
            </GlassCard>
        </div>
    );
}
