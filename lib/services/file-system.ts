
/**
 * Service to handle local file system persistence using the File System Access API.
 */

declare global {
    interface Window {
        showDirectoryPicker: (options?: any) => Promise<FileSystemDirectoryHandle>;
    }
    interface FileSystemHandle {
        queryPermission: (descriptor?: { mode: 'read' | 'readwrite' }) => Promise<PermissionState>;
        requestPermission: (descriptor?: { mode: 'read' | 'readwrite' }) => Promise<PermissionState>;
    }
}

export interface WorkspaceFolder {
    handle: FileSystemDirectoryHandle;
    name: string;
}

class FileSystemService {
    private workspace: WorkspaceFolder | null = null;
    private readonly STORAGE_KEY = 'managed_workspace_handle';

    async init() {
        if (typeof window === 'undefined') return;
        const { useJobStore } = await import('@/lib/stores/job-store');
        const handle = await useJobStore.getState().getSetting(this.STORAGE_KEY);
        if (handle) {
            this.workspace = { handle, name: handle.name };
        }
    }

    async selectWorkspace(): Promise<string | null> {
        try {
            const handle = await window.showDirectoryPicker({
                mode: 'readwrite'
            });
            this.workspace = { handle, name: handle.name };

            const { useJobStore } = await import('@/lib/stores/job-store');
            await useJobStore.getState().saveSetting(this.STORAGE_KEY, handle);

            return handle.name;
        } catch (error) {
            console.error('[FileSystem] Failed to select workspace:', error);
            return null;
        }
    }

    async saveToWorkspace(file: File): Promise<boolean> {
        if (!this.workspace) return false;

        try {
            // Check permission (re-request if necessary)
            const permission = await this.workspace.handle.queryPermission({ mode: 'readwrite' });
            if (permission !== 'granted') {
                const request = await this.workspace.handle.requestPermission({ mode: 'readwrite' });
                if (request !== 'granted') return false;
            }

            const fileHandle = await this.workspace.handle.getFileHandle(file.name, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(await file.arrayBuffer());
            await writable.close();
            console.log(`[FileSystem] Saved ${file.name} to workspace.`);
            return true;
        } catch (error) {
            console.error(`[FileSystem] Failed to save ${file.name}:`, error);
            return false;
        }
    }

    getWorkspaceName(): string | null {
        return this.workspace?.name || null;
    }

    isAvailable(): boolean {
        return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
    }
}

export const fileSystem = new FileSystemService();
