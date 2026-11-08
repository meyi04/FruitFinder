<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title>
          <span class="brand"><img src="/fruitfinder-logo.svg" alt="" />Fruit<span>Finder</span></span>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button aria-label="Profile" router-link="/tabs/profile">
            <ion-icon slot="icon-only" :icon="personCircleOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="page-content">
        <section class="welcome">
          <p class="eyebrow">YOUR COMMUNITY, IN SEASON</p>
          <h1>Good fruit.<br /><span>Good neighbors.</span></h1>
          <p>Discover fresh fruit and the local people who grow it.</p>
          <ion-searchbar
            v-model="search"
            placeholder="Search fruit or supplier"
            :debounce="250"
            class="home-search"
            @ion-input="loadSuppliers"
          />
        </section>

        <section class="section">
          <div class="section-heading">
            <div>
              <p class="eyebrow">FIND YOUR FAVORITE</p>
              <h2>Browse by category</h2>
            </div>
          </div>
          <CategoryChips v-model="category" />
        </section>

        <section class="section">
          <div class="section-heading">
            <div>
              <p class="eyebrow">FRESH AROUND YOU</p>
              <h2>Local suppliers</h2>
            </div>
            <ion-button fill="clear" router-link="/tabs/suppliers">See all</ion-button>
          </div>
          <ion-progress-bar v-if="store.loading" type="indeterminate" />
          <div v-else-if="error" class="inline-error">
            <p>{{ error }}</p>
            <ion-button fill="clear" @click="loadSuppliers">Try again</ion-button>
          </div>
          <div v-else-if="filteredSuppliers.length" class="supplier-grid">
            <SupplierCard v-for="supplier in filteredSuppliers.slice(0, 4)" :key="supplier.id" :supplier="supplier" />
          </div>
          <EmptyState
            v-else
            title="No local suppliers yet"
            message="Try another search or category. New growers are joining all the time."
          />
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonProgressBar,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { personCircleOutline } from 'ionicons/icons';

import CategoryChips from '@/components/CategoryChips.vue';
import EmptyState from '@/components/EmptyState.vue';
import SupplierCard from '@/components/SupplierCard.vue';
import { errorMessage } from '@/composables/useAppToast';
import { useSupplierStore } from '@/stores/supplierStore';

const store = useSupplierStore();
const search = ref('');
const category = ref('');
const error = ref('');
const filteredSuppliers = computed(() => store.suppliers);

async function loadSuppliers(): Promise<void> {
  error.value = '';
  try {
    await store.load({ search: search.value, category: category.value });
  } catch (cause) {
    error.value = errorMessage(cause, 'Unable to load suppliers.');
  }
}

onMounted(loadSuppliers);
watch(category, loadSuppliers);
</script>

<style scoped>
.brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #2e5933;
  font-size: 1.15rem;
  font-weight: 800;
}

.brand img {
  width: 32px;
  height: 32px;
  border-radius: 10px;
}

.brand span {
  color: var(--ion-color-primary);
}

.page-content {
  width: min(100% - 32px, 760px);
  margin: 0 auto;
  padding-bottom: 24px;
}

.welcome {
  margin: 12px -16px 0;
  padding: 26px 24px 24px;
  border-radius: 0 0 28px 28px;
  background: linear-gradient(140deg, #e5f4dd 0%, #fff0d6 100%);
}

.eyebrow {
  margin: 0 0 7px;
  color: #568b4e;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 8vw, 2.8rem);
  line-height: 1.05;
  letter-spacing: -0.045em;
}

h1 span {
  color: #4a9b50;
}

.welcome > p:not(.eyebrow) {
  max-width: 290px;
  color: #60725f;
  line-height: 1.5;
}

.home-search {
  margin: 16px 0 0;
  padding: 0;
  --background: white;
  --border-radius: 14px;
  --box-shadow: 0 5px 16px rgb(46 89 51 / 8%);
}

.section {
  margin-top: 26px;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-heading .eyebrow {
  margin-bottom: 4px;
}

h2 {
  margin: 0;
  font-size: 1.2rem;
}

.supplier-grid {
  display: grid;
  gap: 14px;
}

.inline-error {
  color: var(--ion-color-danger);
}

@media (min-width: 620px) {
  .supplier-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .welcome {
    margin-top: 20px;
  }
}

@media (min-width: 900px) {
  .page-content {
    width: min(100% - 48px, 980px);
  }

  .supplier-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
