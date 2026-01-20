
const DB_NAME = 'PDFToolsDB';
const STORE_NAME = 'history';
const VERSION = 1;

export interface HistoryItem {
    id: string;
    fileName: string;
    tool: string;
    timestamp: number;
    size: number;
    blob?: Blob; // Not stored in index, retrieved separately
}

// Open DB
function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function saveToHistory(item: Omit<HistoryItem, 'timestamp'>): Promise<void> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        const record: HistoryItem = {
            ...item,
            timestamp: Date.now()
        };

        store.put(record);

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.error('Failed to save to history', e);
    }
}

export async function getHistory(): Promise<HistoryItem[]> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                // Sort by timestamp desc
                const results = (request.result as HistoryItem[]).sort((a, b) => b.timestamp - a.timestamp);
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        return [];
    }
}

export async function deleteHistoryItem(id: string): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    return new Promise((resolve) => {
        tx.oncomplete = () => resolve();
    });
}

export async function clearHistory(): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    return new Promise((resolve) => {
        tx.oncomplete = () => resolve();
    });
}
