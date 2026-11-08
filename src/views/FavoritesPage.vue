<template>
  <ion-page>
    <ion-header
      ><ion-toolbar><ion-title>Saved suppliers</ion-title></ion-toolbar></ion-header
    >
    <ion-content>
      <div class="content">
        <p class="intro">Keep your favorite local sellers close at hand.</p>
        <ion-progress-bar v-if="loading" type="indeterminate" />
        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
          <ion-button @click="loadFavorites">Try again</ion-button>
        </div>
        <div v-else-if="suppliers.length" class="grid">
          <SupplierCard
            v-for="supplier in suppliers"
            :key="supplier.id"
            :supplier="supplier"
            :favorite="true"
            @favorite="toggleFavorite(supplier.id)"
          />
        </div>
        <EmptyState
          v-else
          title="Your favorites will live here"
          message="Tap the heart on a supplier to save them for later."
          :icon="heartOutline"
        >
          <ion-button class="browse-button" router-link="/tabs/suppliers">Explore suppliers</ion-button>
        </EmptyState>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { IonButton, IonContent, IonHeader, IonPage, IonProgressBar, IonTitle, IonToolbar } from '@ionic/vue';
import { heartOutline } from 'ionicons/icons';

import EmptyState from '@/components/EmptyState.vue';
import SupplierCard from '@/components/SupplierCard.vue';
import { errorMessage, showToast } from '@/composables/useAppToast';
import { listSuppliers } from '@/services/supplierService';
import { useAuthStore } from '@/stores/authStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import type { Supplier } from '@/types';

const authStore = useAuthStore();
const favoritesStore = useFavoritesStore();
const suppliers = ref<Supplier[]>([]);
const loading = ref(false);
const error = ref('');

async function loadFavorites(): Promise<void> {
  const uid = authStore.profile?.uid;
  if (!uid) return;
  loading.value = true;
  error.value = '';
  try {
    await favoritesStore.load(uid);
    const allSuppliers = await listSuppliers();
    const favoriteIds = new Set(favoritesStore.ids);
    suppliers.value = allSuppliers.filter((supplier) => favoriteIds.has(supplier.id));
  } catch (cause) {
    error.value = errorMessage(cause, 'Unable to load your saved suppliers.');
  } finally {
    loading.value = false;
  }
}

async function toggleFavorite(supplierId: string): Promise<void> {
  const uid = authStore.profile?.uid;
  if (!uid) return;
  try {
    await favoritesStore.toggle(uid, supplierId);
    suppliers.value = suppliers.value.filter((supplier) => supplier.id !== supplierId);
    await showToast('Removed from your favorites.', 'success');
  } catch (cause) {
    await showToast(errorMessage(cause, 'Unable to update your favorites.'));
  }
}

onMounted(loadFavorites);
</script>

<style scoped>
.content {
  width: min(100% - 32px, 760px);
  margin: 0 auto;
  padding-bottom: 24px;
}

.intro {
  margin: 18px 0;
  color: var(--ion-color-medium);
}

.grid {
  display: grid;
  gap: 14px;
}

.browse-button {
  margin-top: 20px;
}

.error-state {
  padding: 28px 12px;
  color: var(--ion-color-danger);
  text-align: center;
}

@media (min-width: 620px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
