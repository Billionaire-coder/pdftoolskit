
import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { fileSystem } from '@/lib/services/file-system';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import toast from 'react-hot-toast';

export const WorkspaceSettings: React.FC = () => {
    const [workspaceName, setWorkspaceName] = useState<string | null>(null);
    const [isAvailable, setIsAvailable] = useState(false);

    useEffect(() => {
        const init = async () => {
            await fileSystem.init();
            setIsAvailable(fileSystem.isAvailable());
            setWorkspaceName(fileSystem.getWorkspaceName());
        };
        init();
    }, []);

    const handleSelectWorkspace = async () => {
        const name = await fileSystem.selectWorkspace();
        if (name) {
            setWorkspaceName(name);
            toast.success(`Active workspace: ${name}`);
        }
    };

    if (!isAvailable) return null;

    return (
        <GlassCard className="p-4 border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Lucide.Folder className="w-4 h-4 text-blue-400" />
                    Managed Workspace
                </h3>
                <Lucide.Settings className="w-4 h-4 text-slate-500" />
            </div>

            <p className="text-xs text-slate-400 mb-4">
                Auto-save processed files directly to a local folder.
            </p>

            {workspaceName ? (
                <div className="flex items-center justify-between p-2 rounded-lg bg-blue-600/10 border border-blue-500/20">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Lucide.Check className="w-4 h-4 text-green-400 shrink-0" />
                        <span className="text-xs text-blue-100 truncate">{workspaceName}</span>
                    </div>
                    <button
                        onClick={() => {
                            // In a real app, we'd clear the handle. 
                            // For now, we'll just allow re-selection.
                            handleSelectWorkspace();
                        }}
                        className="p-1 hover:bg-blue-500/20 rounded-md transition-colors"
                        title="Change Workspace"
                    >
                        <Lucide.RefreshCw className="w-3 h-3 text-blue-400" />
                    </button>
                </div>
            ) : (
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs py-1.5 h-auto border-blue-500/30 hover:bg-blue-500/10"
                    onClick={handleSelectWorkspace}
                >
                    Setup Managed Workspace
                </Button>
            )}
        </GlassCard>
    );
};
