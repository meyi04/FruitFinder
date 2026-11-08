<template>
  <ion-page>
    <ion-header
      ><ion-toolbar><ion-title>Supplier dashboard</ion-title></ion-toolbar></ion-header
    >
    <ion-content>
      <div class="content">
        <div v-if="loading" class="loading"><ion-spinner name="crescent" /></div>
        <div v-else-if="error" class="error-state">
          <EmptyState title="Dashboard unavailable" :message="error">
            <ion-button @click="load">Try again</ion-button>
          </EmptyState>
        </div>
        <template v-else>
          <section class="welcome">
            <p class="eyebrow">YOUR FRUITFINDER STORE</p>
            <h1>{{ businessName || 'Your supplier profile' }}</h1>
            <p>Keep your profile fresh and your fruit listings up to date.</p>
            <ion-button class="activity-button" fill="outline" router-link="/tabs/activity">
              <ion-icon slot="start" :icon="receiptOutline" /> Orders & messages
            </ion-button>
          </section>

          <section class="stats">
            <div class="stat">
              <strong>{{ fruits.length }}</strong
              ><span>Fruit listings</span>
            </div>
            <div class="stat">
              <strong>{{ fruits.filter((fruit) => fruit.inStock).length }}</strong
              ><span>In stock</span>
            </div>
            <div class="stat">
              <strong>{{ averageRating.toFixed(1) }}</strong
              ><span>Avg. rating · {{ reviews.length }}</span>
            </div>
          </section>

          <section class="analytics-card">
            <div class="analytics-heading">
              <div>
                <p class="eyebrow">LAST 30 DAYS</p>
                <h2>Store analytics</h2>
              </div>
              <ion-button fill="clear" router-link="/tabs/reports">
                Reports <ion-icon slot="end" :icon="chevronForwardOutline" />
              </ion-button>
            </div>
            <ion-progress-bar v-if="analyticsLoading" type="indeterminate" />
            <div v-else-if="analyticsError" class="analytics-error">
              <p>{{ analyticsError }}</p>
              <ion-button fill="clear" @click="loadAnalytics">Retry</ion-button>
            </div>
            <template v-else>
              <div class="analytics-metrics">
                <div class="analytics-metric revenue">
                  <span>Completed sales</span>
                  <strong
                    >₱{{
                      analytics.completedRevenue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    }}</strong
                  >
                </div>
                <div class="analytics-metric">
                  <span>Orders</span>
                  <strong>{{ analytics.orderCount }}</strong>
                </div>
                <div class="analytics-metric">
                  <span>Awaiting response</span>
                  <strong>{{ analytics.pendingCount }}</strong>
                </div>
                <div class="analytics-metric">
                  <span>Customers</span>
                  <strong>{{ analytics.buyerCount }}</strong>
                </div>
              </div>
              <div v-if="analytics.dailyRevenue.length" class="sales-chart">
                <div class="chart-heading"><strong>Completed sales</strong><span>By day</span></div>
                <div class="chart-bars">
                  <div v-for="day in chartDays" :key="day.date" class="chart-column">
                    <span class="chart-value">₱{{ Math.round(day.revenue) }}</span>
                    <div class="chart-track">
                      <div class="chart-bar" :style="{ height: `${barHeight(day.revenue)}%` }" />
                    </div>
                    <span class="chart-date">{{ shortDate(day.date) }}</span>
                  </div>
                </div>
              </div>
              <p v-else class="analytics-empty">Completed sales for the last 30 days will appear here.</p>
            </template>
          </section>

          <form class="profile-form" @submit.prevent="saveProfile">
            <div class="form-heading">
              <div>
                <p class="eyebrow">MAKE A GREAT FIRST IMPRESSION</p>
                <h2>Supplier profile</h2>
              </div>
              <ion-toggle v-model="isActive" aria-label="Show supplier profile to buyers" />
            </div>
            <p class="visibility">
              {{ isActive ? 'Your store is visible to buyers.' : 'Your store is hidden from search.' }}
            </p>
            <ion-input
              v-model="businessName"
              label="Business or seller name"
              label-placement="stacked"
              required
              fill="outline"
            />
            <ion-textarea
              v-model="description"
              label="About your business"
              label-placement="stacked"
              :maxlength="500"
              :counter="true"
              auto-grow
              fill="outline"
            />
            <ion-input v-model="phone" label="Contact phone" label-placement="stacked" type="tel" fill="outline" />
            <ion-input v-model="address" label="Street address" label-placement="stacked" fill="outline" />
            <div class="form-row">
              <ion-input v-model="municipality" label="Municipality" label-placement="stacked" fill="outline" />
              <ion-input v-model="barangay" label="Barangay" label-placement="stacked" fill="outline" />
            </div>
            <ion-input
              v-model="facebookLink"
              label="Facebook page or Messenger link"
              label-placement="stacked"
              type="url"
              fill="outline"
            />
            <ion-select
              v-model="orderTypes"
              label="Orders you accept"
              label-placement="stacked"
              interface="popover"
              multiple
              fill="outline"
            >
              <ion-select-option value="retail">Retail</ion-select-option>
              <ion-select-option value="bulk">Bulk</ion-select-option>
              <ion-select-option value="events">Events</ion-select-option>
            </ion-select>
            <ion-select
              v-model="categories"
              label="Fruit categories"
              label-placement="stacked"
              interface="popover"
              multiple
              fill="outline"
            >
              <ion-select-option v-for="category in FRUIT_CATEGORIES" :key="category" :value="category">{{
                category
              }}</ion-select-option>
            </ion-select>
            <ion-button expand="block" type="submit" :disabled="saving">{{
              saving ? 'Saving…' : 'Save supplier profile'
            }}</ion-button>
          </form>

          <section class="listings">
            <div class="listings-heading">
              <div>
                <p class="eyebrow">WHAT’S IN SEASON</p>
                <h2>Your fruit listings</h2>
              </div>
              <ion-button router-link="/supplier/fruits/new"
                ><ion-icon slot="start" :icon="addOutline" /> Add fruit</ion-button
              >
            </div>
            <ion-progress-bar v-if="fruitLoading" type="indeterminate" />
            <div v-else-if="fruits.length" class="fruit-list">
              <FruitItem
                v-for="fruit in fruits"
                :key="fruit.id"
                :fruit="fruit"
                editable
                @edit="editFruit"
                @delete="confirmDelete"
                @toggle="toggleStock"
              />
            </div>
            <EmptyState
              v-else
              title="No fruit listed yet"
              message="Add your first listing so buyers can find what’s fresh."
              :icon="leafOutline"
            >
              <ion-button router-link="/supplier/fruits/new">Add your first fruit</ion-button>
            </EmptyState>
          </section>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { alertController } from '@ionic/vue';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonPage,
  IonProgressBar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/vue';
import { addOutline, chevronForwardOutline, leafOutline, receiptOutline } from 'ionicons/icons';

import EmptyState from '@/components/EmptyState.vue';
import FruitItem from '@/components/FruitItem.vue';
import { errorMessage, showToast } from '@/composables/useAppToast';
import { deleteFruit, listFruits, updateFruit } from '@/services/fruitService';
import { listReviews } from '@/services/reviewService';
import { listOrders } from '@/services/orderService';
import { getSupplier, saveSupplierProfile } from '@/services/supplierService';
import { useAuthStore } from '@/stores/authStore';
import { FRUIT_CATEGORIES } from '@/types';
import type { FruitListing, OrderType, Supplier, SupplierReview } from '@/types';
import { formatReportDate, summarizeOrders } from '@/utils/orderAnalytics';

const authStore = useAuthStore();
const router = useRouter();
const loading = ref(true);
const fruitLoading = ref(false);
const saving = ref(false);
const error = ref('');
const fruits = ref<FruitListing[]>([]);
const reviews = ref<SupplierReview[]>([]);
const analyticsLoading = ref(false);
const analyticsError = ref('');
const analytics = ref(summarizeOrders([]));
const chartDays = computed(() => analytics.value.dailyRevenue.slice(-7));
const supplier = ref<Supplier | null>(null);
const businessName = ref('');
const description = ref('');
const address = ref('');
const municipality = ref('');
const barangay = ref('');
const phone = ref('');
const facebookLink = ref('');
const orderTypes = ref<OrderType[]>(['retail']);
const categories = ref<string[]>([]);
const isActive = ref(true);
const averageRating = computed(() => {
  if (!reviews.value.length) return 0;
  return reviews.value.reduce((sum, review) => sum + review.rating, 0) / reviews.value.length;
});

function populateProfile(value: Supplier): void {
  supplier.value = value;
  businessName.value = value.businessName || '';
  description.value = value.description || '';
  address.value = value.address || '';
  municipality.value = value.municipality || '';
  barangay.value = value.barangay || '';
  phone.value = value.phone || '';
  facebookLink.value = value.facebookLink || '';
  orderTypes.value = value.orderTypes?.length ? [...value.orderTypes] : ['retail'];
  categories.value = value.categories || [];
  isActive.value = value.isActive !== false;
}

async function load(): Promise<void> {
  const uid = authStore.profile?.uid;
  if (!uid) return;
  loading.value = true;
  error.value = '';
  try {
    const [profile, fruitResults, reviewResults] = await Promise.all([
      getSupplier(uid),
      listFruits(uid),
      listReviews(uid),
    ]);
    if (!profile) throw new Error('Supplier profile not found. Please sign out and register again.');
    populateProfile(profile);
    fruits.value = fruitResults;
    reviews.value = reviewResults;
    await loadAnalytics();
  } catch (cause) {
    error.value = errorMessage(cause, 'Unable to load your supplier dashboard.');
  } finally {
    loading.value = false;
    fruitLoading.value = false;
  }
}

async function loadAnalytics(): Promise<void> {
  const uid = authStore.profile?.uid;
  if (!uid) return;
  analyticsLoading.value = true;
  analyticsError.value = '';
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 29);
  try {
    const orders = await listOrders(uid, 'supplier', {
      startDate: formatReportDate(startDate),
      endDate: formatReportDate(endDate),
    });
    analytics.value = summarizeOrders(orders);
  } catch (cause) {
    analyticsError.value = errorMessage(cause, 'Unable to load store analytics.');
  } finally {
    analyticsLoading.value = false;
  }
}

function barHeight(revenue: number): number {
  const maxRevenue = Math.max(...chartDays.value.map((day) => day.revenue), 1);
  return Math.max(8, (revenue / maxRevenue) * 100);
}

function shortDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

async function saveProfile(): Promise<void> {
  const uid = authStore.profile?.uid;
  if (!uid) return;
  if (businessName.value.trim().length < 2) {
    await showToast('Your business name must have at least 2 characters.');
    return;
  }
  if (!orderTypes.value.length) {
    await showToast('Choose at least one order type so buyers know what you accept.');
    return;
  }
  if (facebookLink.value.trim()) {
    try {
      const url = new URL(facebookLink.value);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('invalid protocol');
    } catch {
      await showToast('Enter a valid Facebook or Messenger link.');
      return;
    }
  }
  saving.value = true;
  try {
    await saveSupplierProfile(uid, {
      businessName: businessName.value.trim(),
      description: description.value.trim(),
      address: address.value.trim(),
      municipality: municipality.value.trim(),
      barangay: barangay.value.trim(),
      phone: phone.value.trim(),
      facebookLink: facebookLink.value.trim(),
      orderTypes: orderTypes.value,
      categories: categories.value,
      isActive: isActive.value,
    });
    await showToast('Supplier profile saved.', 'success');
  } catch (cause) {
    await showToast(errorMessage(cause, 'Unable to save supplier profile.'));
  } finally {
    saving.value = false;
  }
}

function editFruit(fruit: FruitListing): void {
  void router.push(`/supplier/fruits/${fruit.id}`);
}

async function confirmDelete(fruit: FruitListing): Promise<void> {
  const alert = await alertController.create({
    header: 'Delete listing?',
    message: `Remove ${fruit.name} from your fruit listings?`,
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Delete',
        role: 'destructive',
        handler: () => {
          void removeFruit(fruit);
        },
      },
    ],
  });
  await alert.present();
}

async function removeFruit(fruit: FruitListing): Promise<void> {
  const uid = authStore.profile?.uid;
  if (!uid) return;
  try {
    await deleteFruit(uid, fruit.id);
    fruits.value = fruits.value.filter((item) => item.id !== fruit.id);
    await showToast('Fruit listing deleted.', 'success');
  } catch (cause) {
    await showToast(errorMessage(cause, 'Unable to delete fruit listing.'));
  }
}

async function toggleStock(fruit: FruitListing, inStock: boolean): Promise<void> {
  const uid = authStore.profile?.uid;
  if (!uid) return;
  const updated = { ...fruit, inStock };
  try {
    await updateFruit(uid, fruit.id, {
      name: updated.name,
      category: updated.category,
      price: updated.price,
      unit: updated.unit,
      inStock: updated.inStock,
      minBulkQty: updated.minBulkQty,
      description: updated.description,
      imageUrl: updated.imageUrl,
    });
    fruits.value = fruits.value.map((item) => (item.id === fruit.id ? updated : item));
    await showToast(`${fruit.name} marked ${inStock ? 'in stock' : 'unavailable'}.`, 'success');
  } catch (cause) {
    await showToast(errorMessage(cause, 'Unable to update stock status.'));
    await load();
  }
}

onMounted(load);
</script>

<style scoped>
.content {
  width: min(100% - 32px, 720px);
  margin: 0 auto;
  padding-bottom: 36px;
}

.loading {
  display: grid;
  min-height: 50vh;
  place-items: center;
  color: var(--ion-color-primary);
}

.welcome {
  margin: 16px -16px 14px;
  padding: 22px 24px;
  border-radius: 0 0 24px 24px;
  background: linear-gradient(140deg, #e5f4dd, #fff0d6);
}

.eyebrow {
  margin: 0 0 6px;
  color: #568b4e;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}

h1 {
  margin: 0;
  font-size: 1.65rem;
}

.welcome > p {
  margin: 8px 0 0;
  color: #60725f;
}

.activity-button {
  margin: 12px 0 0;
  --background: white;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 9px;
  margin: 16px 0 20px;
}

.stat {
  display: grid;
  min-height: 78px;
  align-content: center;
  gap: 3px;
  border-radius: 14px;
  background: white;
  text-align: center;
}

.analytics-card {
  margin: 0 0 22px;
  padding: 18px;
  border-radius: 18px;
  background: white;
  box-shadow: 0 4px 18px rgb(38 51 40 / 5%);
}

.analytics-heading,
.chart-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.analytics-heading h2 {
  margin: 0;
  font-size: 1.15rem;
}

.analytics-heading ion-button {
  margin: 0;
}

.analytics-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.analytics-metric {
  display: grid;
  gap: 5px;
  min-height: 76px;
  align-content: center;
  padding: 10px 12px;
  border-radius: 13px;
  background: #f5f8f3;
}

.analytics-metric span,
.chart-heading span {
  color: var(--ion-color-medium);
  font-size: 0.76rem;
}

.analytics-metric strong {
  font-size: 1.2rem;
}

.analytics-metric.revenue {
  background: #eaf5e9;
}

.analytics-metric.revenue strong {
  color: var(--ion-color-primary-shade);
}

.sales-chart {
  margin-top: 20px;
}

.chart-heading {
  margin-bottom: 10px;
  font-size: 0.85rem;
}

.chart-bars {
  display: flex;
  height: 128px;
  align-items: flex-end;
  justify-content: space-around;
  gap: 8px;
  padding-top: 14px;
}

.chart-column {
  display: grid;
  height: 100%;
  min-width: 0;
  flex: 1;
  grid-template-rows: 15px 1fr 16px;
  justify-items: center;
  gap: 4px;
}

.chart-value,
.chart-date {
  overflow: hidden;
  max-width: 100%;
  color: var(--ion-color-medium);
  font-size: 0.63rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chart-track {
  display: flex;
  width: min(100%, 28px);
  height: 100%;
  align-items: flex-end;
  overflow: hidden;
  border-radius: 8px;
  background: #f0f3ee;
}

.chart-bar {
  width: 100%;
  min-height: 3px;
  border-radius: 8px;
  background: linear-gradient(180deg, #72c678, #4caf50);
}

.analytics-empty,
.analytics-error {
  margin: 14px 0 0;
  color: var(--ion-color-medium);
  font-size: 0.84rem;
}

.analytics-error {
  color: var(--ion-color-danger);
}

.analytics-error p {
  margin: 0;
}

.stat strong {
  color: var(--ion-color-primary-shade);
  font-size: 1.25rem;
}

.stat span {
  color: var(--ion-color-medium);
  font-size: 0.71rem;
}

.profile-form {
  display: grid;
  gap: 13px;
  padding: 18px;
  border-radius: 18px;
  background: white;
}

.form-heading,
.listings-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

h2 {
  margin: 0;
  font-size: 1.15rem;
}

.visibility {
  margin: -8px 0 0;
  color: var(--ion-color-medium);
  font-size: 0.82rem;
}

ion-input,
ion-textarea,
ion-select {
  --background: #fbfcfa;
  --border-radius: 12px;
  --padding-start: 12px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.listings {
  margin-top: 28px;
}

.listings-heading {
  margin-bottom: 12px;
}

.fruit-list {
  padding: 8px 12px;
  border-radius: 16px;
  background: white;
}

.error-state {
  text-align: center;
}

@media (min-width: 760px) {
  .content {
    width: min(100% - 48px, 900px);
  }

  .stats {
    gap: 14px;
  }

  .analytics-metrics {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .form-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
