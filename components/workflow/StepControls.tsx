import React from 'react';
import { WorkflowAction } from '@/lib/workflow-engine';
import { Plus, Maximize, RotateCw, FileInput, Shield, ShieldAlert, Hash, ArrowUpDown, FileText } from 'lucide-react';

interface StepControlsProps {
    onAddStep: (type: WorkflowAction) => void;
}

export function StepControls({ onAddStep }: StepControlsProps) {
    const actions: { type: WorkflowAction; label: string; icon: React.ReactNode; group: string }[] = [
        { type: 'merge', label: 'Merge All', icon: <Maximize className="w-4 h-4" />, group: 'Basic' },
        { type: 'compress', label: 'Compress', icon: <FileInput className="w-4 h-4 text-amber-400" />, group: 'Basic' },
        { type: 'rotate', label: 'Rotate', icon: <RotateCw className="w-4 h-4 text-blue-400" />, group: 'Organize' },
        { type: 'reorder', label: 'Reverse', icon: <ArrowUpDown className="w-4 h-4 text-blue-400" />, group: 'Organize' },
        { type: 'pageNumbers', label: 'Page Numbers', icon: <Hash className="w-4 h-4 text-blue-400" />, group: 'Organize' },
        { type: 'protect', label: 'Protect', icon: <Shield className="w-4 h-4 text-green-400" />, group: 'Secure' },
        { type: 'watermark', label: 'Watermark', icon: <ShieldAlert className="w-4 h-4 text-purple-400" />, group: 'Secure' },
        { type: 'metadata', label: 'Metadata', icon: <FileText className="w-4 h-4 text-purple-400" />, group: 'Secure' },
        { type: 'extract', label: 'Extract Pages', icon: <FileInput className="w-4 h-4 text-green-400" />, group: 'Organize' },
        { type: 'split', label: 'Split PDF', icon: <Maximize className="w-4 h-4 text-green-400" />, group: 'Organize' },
        { type: 'pdfToImage', label: 'PDF to Image', icon: <FileInput className="w-4 h-4 text-amber-400" />, group: 'Basic' },
    ];

    // Grouping
    const groups = ['Basic', 'Organize', 'Secure'];

    return (
        <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
            <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Action
            </h3>

            <div className="space-y-4">
                {groups.map(group => (
                    <div key={group}>
                        <h4 className="text-xs text-slate-500 uppercase font-semibold mb-2">{group}</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {actions.filter(a => a.group === group).map(action => (
                                <button
                                    key={action.type}
                                    onClick={() => onAddStep(action.type)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-sm transition-colors text-left"
                                >
                                    {action.icon}
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
