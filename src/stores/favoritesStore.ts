import { defineStore } from 'pinia';
import { ref } from 'vue';

import { listFavoriteIds, removeFavorite, saveFavorite } from '@/services/favoritesService';

export const useFavoritesStore = defineStore('favorites', () => {
  const ids = ref<string[]>([]);
  const loading = ref(false);

  async function load(uid: string): Promise<void> {
    loading.value = true;
    try {
      ids.value = await listFavoriteIds(uid);
    } finally {
      loading.value = false;
    }
  }

  async function toggle(uid: string, supplierId: string): Promise<void> {
    const existing = ids.value.includes(supplierId);
    if (existing) {
      await removeFavorite(uid, supplierId);
      ids.value = ids.value.filter((id) => id !== supplierId);
    } else {
      await saveFavorite(uid, supplierId);
      ids.value = [...ids.value, supplierId];
    }
  }

  return { ids, loading, load, toggle };
});
