import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface FavoritesStore {
    favorites: string[]; // List of tool IDs
    addFavorite: (toolId: string) => void;
    removeFavorite: (toolId: string) => void;
    toggleFavorite: (toolId: string) => void;
    isFavorite: (toolId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesStore>()(
    persist(
        (set, get) => ({
            favorites: [],
            addFavorite: (toolId) => {
                if (!get().favorites.includes(toolId)) {
                    set({ favorites: [...get().favorites, toolId] });
                }
            },
            removeFavorite: (toolId) => {
                set({ favorites: get().favorites.filter((id) => id !== toolId) });
            },
            toggleFavorite: (toolId) => {
                if (get().favorites.includes(toolId)) {
                    get().removeFavorite(toolId);
                } else {
                    get().addFavorite(toolId);
                }
            },
            isFavorite: (toolId) => get().favorites.includes(toolId),
        }),
        {
            name: 'pdftoolkit-favorites',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
