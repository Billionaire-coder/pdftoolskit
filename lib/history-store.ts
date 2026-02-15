import { useJobStore, type HistoryItem as NewHistoryItem } from './stores/job-store';

export type HistoryItem = NewHistoryItem;

export async function saveToHistory(item: Omit<HistoryItem, 'timestamp'>): Promise<void> {
    return useJobStore.getState().addToHistory(item);
}

export async function getHistory(): Promise<HistoryItem[]> {
    const store = useJobStore.getState();
    await store.loadHistory();
    return store.history;
}

export async function deleteHistoryItem(id: string): Promise<void> {
    return useJobStore.getState().removeFromHistory(id);
}

export async function clearHistory(): Promise<void> {
    return useJobStore.getState().clearHistory();
}

