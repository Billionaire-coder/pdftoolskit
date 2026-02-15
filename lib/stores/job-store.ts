/* eslint-disable */
import { create } from 'zustand';
import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'PDFToolskit_Storage';
const STORE_NAME = 'history';
const SETTINGS_STORE = 'settings';
const VERSION = 3; // Upgraded from 2 to add settings store
const SYNC_CHANNEL = 'pdftoolskit_sync';

export interface HistoryItem {
    id: string;
    fileName: string;
    tool: string;
    timestamp: number;
    size: number;
    blob?: Blob;
}

export interface Job {
    id: string;
    fileName: string;
    tool: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    error?: string;
    result?: Blob;
}

interface JobStore {
    jobs: Record<string, Job>;
    history: HistoryItem[];
    addJob: (job: Omit<Job, 'status' | 'progress'>, silent?: boolean) => void;
    updateJob: (id: string, updates: Partial<Job>, silent?: boolean) => void;
    removeJob: (id: string, silent?: boolean) => void;

    // History Actions
    loadHistory: () => Promise<void>;
    addToHistory: (item: Omit<HistoryItem, 'timestamp'>, silent?: boolean) => Promise<void>;
    removeFromHistory: (id: string, silent?: boolean) => Promise<void>;
    clearHistory: (silent?: boolean) => Promise<void>;

    // Data Persistence Helpers (Phase 4)
    getStorageEstimate: () => Promise<StorageEstimate | null>;
    saveSetting: (key: string, value: any) => Promise<void>;
    getSetting: (key: string) => Promise<any>;
}

let dbPromise: Promise<IDBPDatabase> | null = null;
let broadcastChannel: BroadcastChannel | null = null;

function getDB() {
    if (typeof window === 'undefined') return null;
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, VERSION, {
            upgrade(db, oldVersion, _, transaction) {
                if (oldVersion < 1) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('timestamp', 'timestamp');
                }
                if (oldVersion < 2) {
                    const store = transaction.objectStore(STORE_NAME);
                    if (!store.indexNames.contains('timestamp')) {
                        store.createIndex('timestamp', 'timestamp');
                    }
                }
                if (oldVersion < 3) {
                    if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
                        db.createObjectStore(SETTINGS_STORE);
                    }
                }
            },
        });
    }
    return dbPromise;
}

function getBroadcastChannel() {
    if (typeof window === 'undefined') return null;
    if (!broadcastChannel) {
        broadcastChannel = new BroadcastChannel(SYNC_CHANNEL);
    }
    return broadcastChannel;
}

export const useJobStore = create<JobStore>((set, get) => {
    // Listen for sync messages
    if (typeof window !== 'undefined') {
        const channel = getBroadcastChannel();
        if (channel) {
            channel.onmessage = (event) => {
                const { type, payload } = event.data;
                switch (type) {
                    case 'SYNC_JOB_ADD':
                        set((state) => ({ jobs: { ...state.jobs, [payload.id]: payload } }));
                        break;
                    case 'SYNC_JOB_UPDATE':
                        set((state) => ({ jobs: { ...state.jobs, [payload.id]: { ...(state.jobs[payload.id] || {}), ...payload.updates } } }));
                        break;
                    case 'SYNC_JOB_REMOVE':
                        set((state) => {
                            const newJobs = { ...state.jobs };
                            delete newJobs[payload.id];
                            return { jobs: newJobs };
                        });
                        break;
                    case 'SYNC_HISTORY_LOAD':
                        get().loadHistory();
                        break;
                }
            };
        }
    }

    return {
        jobs: {},
        history: [],

        addJob: (job, silent = false) => {
            const newJob = { ...job, status: 'pending', progress: 0 } as Job;
            set((state) => ({
                jobs: {
                    ...state.jobs,
                    [job.id]: newJob
                }
            }));
            if (!silent) getBroadcastChannel()?.postMessage({ type: 'SYNC_JOB_ADD', payload: newJob });
        },

        updateJob: (id, updates, silent = false) => {
            set((state) => ({
                jobs: {
                    ...state.jobs,
                    [id]: { ...(state.jobs[id] || {}), ...updates } as Job
                }
            }));
            if (!silent) getBroadcastChannel()?.postMessage({ type: 'SYNC_JOB_UPDATE', payload: { id, updates } });
        },

        removeJob: (id, silent = false) => {
            set((state) => {
                const newJobs = { ...state.jobs };
                delete newJobs[id];
                return { jobs: newJobs };
            });
            if (!silent) getBroadcastChannel()?.postMessage({ type: 'SYNC_JOB_REMOVE', payload: { id } });
        },

        loadHistory: async () => {
            const db = await getDB();
            if (!db) return;

            // Use cursor to load only recent items (e.g., last 50) for efficiency
            const history: HistoryItem[] = [];
            let cursor = await db.transaction(STORE_NAME).store.index('timestamp').openCursor(null, 'prev');

            let count = 0;
            const LIMIT = 50;

            while (cursor && count < LIMIT) {
                history.push(cursor.value);
                cursor = await cursor.continue();
                count++;
            }

            set({ history });
        },

        addToHistory: async (item, silent = false) => {
            const db = await getDB();
            if (!db) return;
            const record: HistoryItem = { ...item, timestamp: Date.now() };
            await db.put(STORE_NAME, record);
            set((state) => ({
                history: [record, ...state.history].sort((a, b) => b.timestamp - a.timestamp)
            }));
            if (!silent) getBroadcastChannel()?.postMessage({ type: 'SYNC_HISTORY_LOAD' });
        },

        removeFromHistory: async (id, silent = false) => {
            const db = await getDB();
            if (!db) return;
            await db.delete(STORE_NAME, id);
            set((state) => ({
                history: state.history.filter(i => i.id !== id)
            }));
            if (!silent) getBroadcastChannel()?.postMessage({ type: 'SYNC_HISTORY_LOAD' });
        },

        clearHistory: async (silent = false) => {
            const db = await getDB();
            if (!db) return;
            await db.clear(STORE_NAME);
            set({ history: [] });
            if (!silent) getBroadcastChannel()?.postMessage({ type: 'SYNC_HISTORY_LOAD' });
        },

        // Quota & Settings Helpers
        getStorageEstimate: async () => {
            if (typeof navigator !== 'undefined' && 'storage' in navigator && 'estimate' in navigator.storage) {
                return await navigator.storage.estimate();
            }
            return null;
        },

        saveSetting: async (key: string, value: any) => {
            const db = await getDB();
            if (!db) return;
            await db.put(SETTINGS_STORE, value, key);
        },

        getSetting: async (key: string) => {
            const db = await getDB();
            if (!db) return null;
            return await db.get(SETTINGS_STORE, key);
        }
    };
});
