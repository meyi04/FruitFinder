<template>
  <ion-page>
    <ion-header>
      <ion-toolbar><ion-title>Find suppliers</ion-title></ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="content">
        <p class="intro">Meet local growers, markets, and fruit sellers near you.</p>
        <ion-searchbar
          v-model="search"
          placeholder="Search supplier or location"
          :debounce="250"
          @ion-input="applyFilters"
        />
        <div class="filters">
          <ion-select
            v-model="municipality"
            aria-label="Municipality"
            placeholder="Municipality"
            interface="popover"
            @ion-change="applyFilters"
          >
            <ion-select-option value="">All municipalities</ion-select-option>
            <ion-select-option v-for="item in municipalities" :key="item" :value="item">{{ item }}</ion-select-option>
          </ion-select>
          <ion-select
            v-model="barangay"
            aria-label="Barangay"
            placeholder="Barangay"
            interface="popover"
            @ion-change="applyFilters"
          >
            <ion-select-option value="">All barangays</ion-select-option>
            <ion-select-option v-for="item in barangays" :key="item" :value="item">{{ item }}</ion-select-option>
          </ion-select>
          <ion-select
            v-model="category"
            aria-label="Fruit category"
            placeholder="Fruit type"
            interface="popover"
            @ion-change="applyFilters"
          >
            <ion-select-option value="">All fruits</ion-select-option>
            <ion-select-option v-for="item in FRUIT_CATEGORIES" :key="item" :value="item">{{ item }}</ion-select-option>
          </ion-select>
          <ion-select
            v-model="orderType"
            aria-label="Order type"
            placeholder="Order type"
            interface="popover"
            @ion-change="applyFilters"
          >
            <ion-select-option value="">Any order</ion-select-option>
            <ion-select-option value="retail">Retail</ion-select-option>
            <ion-select-option value="bulk">Bulk</ion-select-option>
            <ion-select-option value="events">Events</ion-select-option>
          </ion-select>
        </div>

        <div class="results-heading">
          <h2>
            Suppliers <span v-if="!store.loading">({{ store.suppliers.length }})</span>
          </h2>
          <ion-button fill="clear" size="small" @click="resetFilters">Reset</ion-button>
        </div>
        <ion-progress-bar v-if="store.loading" type="indeterminate" />
        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
          <ion-button @click="applyFilters">Try again</ion-button>
        </div>
        <div v-else-if="visibleSuppliers.length" class="supplier-grid">
          <SupplierCard v-for="supplier in visibleSuppliers" :key="supplier.id" :supplier="supplier" />
        </div>
        <EmptyState
          v-else
          title="No suppliers match"
          message="Adjust your search or filters to find more local sellers."
          :icon="searchOutline"
        />

        <ion-infinite-scroll :disabled="!hasMore || store.loading" @ionInfinite="loadMore">
          <ion-infinite-scroll-content loading-text="Finding more suppliers…" />
        </ion-infinite-scroll>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonPage,
  IonProgressBar,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { searchOutline } from 'ionicons/icons';

import EmptyState from '@/components/EmptyState.vue';
import SupplierCard from '@/components/SupplierCard.vue';
import { errorMessage } from '@/composables/useAppToast';
import { useSupplierStore } from '@/stores/supplierStore';
import { FRUIT_CATEGORIES } from '@/types';

const store = useSupplierStore();
const search = ref('');
const municipality = ref('');
const barangay = ref('');
const category = ref('');
const orderType = ref<'' | 'retail' | 'bulk' | 'events'>('');
const pageSize = 8;
const page = ref(1);
const error = ref('');

const municipalities = computed(() =>
  [...new Set(store.suppliers.map((item) => item.municipality).filter(Boolean))].sort(),
);
const barangays = computed(() => [...new Set(store.suppliers.map((item) => item.barangay).filter(Boolean))].sort());
const visibleSuppliers = computed(() => store.suppliers.slice(0, page.value * pageSize));
const hasMore = computed(() => visibleSuppliers.value.length < store.suppliers.length);

async function applyFilters(): Promise<void> {
  page.value = 1;
  error.value = '';
  try {
    await store.load({
      search: search.value,
      municipality: municipality.value,
      barangay: barangay.value,
      category: category.value,
      orderType: orderType.value,
    });
  } catch (cause) {
    error.value = errorMessage(cause, 'Unable to load suppliers.');
  }
}

async function resetFilters(): Promise<void> {
  search.value = '';
  municipality.value = '';
  barangay.value = '';
  category.value = '';
  orderType.value = '';
  await applyFilters();
}

async function loadMore(event: CustomEvent): Promise<void> {
  page.value += 1;
  await (event.target as HTMLIonInfiniteScrollElement).complete();
}

onMounted(applyFilters);
</script>

<style scoped>
.content {
  width: min(100% - 32px, 760px);
  margin: 0 auto;
  padding-bottom: 24px;
}

.intro {
  margin: 16px 0 10px;
  color: var(--ion-color-medium);
}

ion-searchbar {
  padding: 0;
  --background: white;
  --border-radius: 14px;
}

.filters {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
  margin-top: 12px;
}

.filters ion-select {
  min-height: 44px;
  border: 1px solid var(--ion-border-color);
  border-radius: 12px;
  padding: 0 8px;
  background: white;
  font-size: 0.85rem;
}

.results-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 20px 0 10px;
}

h2 {
  margin: 0;
  font-size: 1.1rem;
}

h2 span {
  color: var(--ion-color-medium);
  font-size: 0.9rem;
  font-weight: 400;
}

.supplier-grid {
  display: grid;
  gap: 14px;
}

.error-state {
  padding: 28px 12px;
  color: var(--ion-color-danger);
  text-align: center;
}

@media (min-width: 620px) {
  .supplier-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 760px) {
  .content {
    width: min(100% - 48px, 960px);
  }

  .filters {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .supplier-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1100px) {
  .supplier-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
