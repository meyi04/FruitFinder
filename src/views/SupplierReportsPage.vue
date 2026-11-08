<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button default-href="/tabs/dashboard" /></ion-buttons>
        <ion-title>Sales reports</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="loading || !orders.length" aria-label="Export report as CSV" @click="exportCsv">
            <ion-icon slot="icon-only" :icon="downloadOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="content">
        <section class="intro">
          <p class="eyebrow">YOUR STORE PERFORMANCE</p>
          <h1>Sales reports</h1>
          <p>Filter orders by date and review completed sales, order activity, and popular fruit.</p>
        </section>

        <section class="filters">
          <div class="quick-filters" aria-label="Quick date ranges">
            <ion-button size="small" :fill="selectedPreset === '7' ? 'solid' : 'outline'" @click="setPreset('7')">
              7 days
            </ion-button>
            <ion-button size="small" :fill="selectedPreset === '30' ? 'solid' : 'outline'" @click="setPreset('30')">
              30 days
            </ion-button>
            <ion-button size="small" :fill="selectedPreset === '90' ? 'solid' : 'outline'" @click="setPreset('90')">
              90 days
            </ion-button>
          </div>
          <div class="date-fields">
            <ion-input v-model="startDate" type="date" label="From" label-placement="stacked" fill="outline" />
            <ion-input v-model="endDate" type="date" label="To" label-placement="stacked" fill="outline" />
          </div>
          <p v-if="dateError" class="date-error">{{ dateError }}</p>
          <ion-button expand="block" :disabled="loading || Boolean(dateError)" @click="loadReport">
            {{ loading ? 'Loading report…' : 'Apply date range' }}
          </ion-button>
          <p v-if="!dateError" class="range-caption">{{ rangeCaption }}</p>
        </section>

        <div v-if="loading" class="loading"><ion-spinner name="crescent" /></div>
        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
          <ion-button @click="loadReport">Try again</ion-button>
        </div>
        <template v-else>
          <section class="download-section">
            <p>Your report for {{ rangeCaption }} is ready to save.</p>
            <ion-button expand="block" @click="exportCsv">
              <ion-icon slot="start" :icon="downloadOutline" />
              Download report (CSV)
            </ion-button>
          </section>

          <section class="metrics">
            <article class="metric primary">
              <span>Completed sales</span>
              <strong
                >₱{{
                  report.completedRevenue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                }}</strong
              >
            </article>
            <article class="metric">
              <span>Total orders</span>
              <strong>{{ report.orderCount }}</strong>
            </article>
            <article class="metric">
              <span>Completed</span>
              <strong>{{ report.completedCount }}</strong>
            </article>
            <article class="metric">
              <span>Pending</span>
              <strong>{{ report.pendingCount }}</strong>
            </article>
            <article class="metric">
              <span>Average completed order</span>
              <strong
                >₱{{
                  report.averageCompletedOrder.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                }}</strong
              >
            </article>
            <article class="metric">
              <span>Customers</span>
              <strong>{{ report.buyerCount }}</strong>
            </article>
          </section>

          <section class="report-section">
            <div class="section-heading">
              <div>
                <p class="eyebrow">COMPLETED ORDERS</p>
                <h2>Daily sales</h2>
              </div>
            </div>
            <div v-if="report.dailyRevenue.length" class="daily-list">
              <div v-for="day in report.dailyRevenue" :key="day.date" class="daily-row">
                <div class="daily-copy">
                  <strong>{{ displayDate(day.date) }}</strong
                  ><span>{{ day.orderCount }} orders</span>
                </div>
                <strong
                  >₱{{
                    day.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  }}</strong
                >
              </div>
            </div>
            <p v-else class="empty-note">No completed sales in this date range.</p>
          </section>

          <section class="report-section">
            <div class="section-heading">
              <div>
                <p class="eyebrow">MOST ORDERED</p>
                <h2>Popular fruits</h2>
              </div>
            </div>
            <div v-if="report.topFruits.length" class="daily-list">
              <div v-for="fruit in report.topFruits" :key="fruit.name" class="daily-row">
                <div class="daily-copy">
                  <strong>{{ fruit.name }}</strong
                  ><span>{{ fruit.quantity }} units sold</span>
                </div>
                <strong
                  >₱{{
                    fruit.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  }}</strong
                >
              </div>
            </div>
            <p v-else class="empty-note">Completed order items will appear here.</p>
          </section>

          <section class="report-section">
            <div class="section-heading">
              <div>
                <p class="eyebrow">ORDER HISTORY</p>
                <h2>
                  Orders in range <span>({{ orders.length }})</span>
                </h2>
              </div>
            </div>
            <div v-if="orders.length" class="daily-list order-list">
              <article v-for="order in orders" :key="order.id" class="report-order">
                <div class="order-header">
                  <div>
                    <strong>{{ order.buyerName }}</strong
                    ><span>{{ displayTimestamp(order.createdAt) }}</span>
                  </div>
                  <ion-badge :color="statusColor(order.status)">{{ order.status }}</ion-badge>
                </div>
                <div v-for="item in order.items" :key="item.fruitId" class="order-item">
                  <span>{{ item.quantity }} × {{ item.name }}</span
                  ><span>₱{{ item.subtotal.toFixed(2) }}</span>
                </div>
                <div class="order-total">
                  <span>{{ typeLabel(order.orderType) }}</span
                  ><strong>₱{{ order.total.toFixed(2) }}</strong>
                </div>
              </article>
            </div>
            <EmptyState
              v-else
              title="No orders in this range"
              message="Try a wider date range. New supplier orders will show here."
              :icon="receiptOutline"
            />
          </section>
          <p class="report-note">
            Completed sales include only orders marked completed. Pending orders are not counted as sales.
          </p>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onIonViewWillEnter } from '@ionic/vue';
import {
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { computed, ref } from 'vue';
import { downloadOutline, receiptOutline } from 'ionicons/icons';

import EmptyState from '@/components/EmptyState.vue';
import { errorMessage, showToast } from '@/composables/useAppToast';
import { listOrders } from '@/services/orderService';
import { useAuthStore } from '@/stores/authStore';
import type { FruitOrder, OrderStatus, OrderType } from '@/types';
import { formatReportDate, summarizeOrders } from '@/utils/orderAnalytics';

const authStore = useAuthStore();
const endDate = ref(formatReportDate(new Date()));
const startDate = ref(formatReportDate(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)));
const selectedPreset = ref('30');
const orders = ref<FruitOrder[]>([]);
const loading = ref(true);
const error = ref('');
const dateError = computed(() => {
  if (!startDate.value || !endDate.value) return 'Choose both a start and end date.';
  if (startDate.value > endDate.value) return 'Start date must be on or before the end date.';
  return '';
});
const report = computed(() => summarizeOrders(orders.value));
const rangeCaption = computed(() => {
  if (!startDate.value || !endDate.value) return '';
  return `${displayDate(startDate.value)} – ${displayDate(endDate.value)}`;
});

async function loadReport(): Promise<void> {
  const user = authStore.profile;
  if (!user || user.role !== 'supplier' || dateError.value) return;
  loading.value = true;
  error.value = '';
  try {
    orders.value = await listOrders(user.uid, 'supplier', {
      startDate: startDate.value,
      endDate: endDate.value,
    });
  } catch (cause) {
    error.value = errorMessage(cause, 'Unable to load sales report.');
  } finally {
    loading.value = false;
  }
}

function setPreset(days: '7' | '30' | '90'): void {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (Number(days) - 1));
  startDate.value = formatReportDate(start);
  endDate.value = formatReportDate(end);
  selectedPreset.value = days;
  void loadReport();
}

function csvCell(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`;
}

async function exportCsv(): Promise<void> {
  const rows: Array<Array<string | number>> = [
    ['FruitFinder sales report'],
    ['Date range', displayDate(startDate.value), 'to', displayDate(endDate.value)],
    ['Generated', new Date().toLocaleString()],
    [],
    ['SUMMARY'],
    ['Metric', 'Value'],
    ['Completed sales', report.value.completedRevenue.toFixed(2)],
    ['Total orders', report.value.orderCount],
    ['Completed orders', report.value.completedCount],
    ['Pending orders', report.value.pendingCount],
    ['Declined orders', report.value.declinedCount],
    ['Average completed order', report.value.averageCompletedOrder.toFixed(2)],
    ['Customers', report.value.buyerCount],
    [],
    ['DAILY SALES'],
    ['Date', 'Completed orders', 'Revenue'],
    ...report.value.dailyRevenue.map((day) => [displayDate(day.date), day.orderCount, day.revenue.toFixed(2)]),
    [],
    ['POPULAR FRUITS'],
    ['Fruit', 'Quantity sold', 'Revenue'],
    ...report.value.topFruits.map((fruit) => [fruit.name, fruit.quantity, fruit.revenue.toFixed(2)]),
    [],
    ['ORDER HISTORY'],
    ['Order ID', 'Date', 'Buyer', 'Status', 'Order type', 'Items', 'Total'],
    ...orders.value.map((order) => [
      order.id,
      displayTimestamp(order.createdAt),
      order.buyerName,
      order.status,
      typeLabel(order.orderType),
      order.items.map((item) => `${item.quantity} x ${item.name}`).join('; '),
      order.total.toFixed(2),
    ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `fruitfinder-report-${startDate.value}-to-${endDate.value}.csv`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  await showToast('Sales report downloaded as CSV.', 'success');
}

function displayDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function displayTimestamp(timestamp?: { toDate: () => Date }): string {
  if (!timestamp) return 'Date unavailable';
  return timestamp.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function typeLabel(type: OrderType): string {
  return type === 'events' ? 'Events' : type === 'bulk' ? 'Bulk' : 'Retail';
}

function statusColor(status: OrderStatus): string {
  if (status === 'accepted' || status === 'completed') return 'success';
  if (status === 'declined' || status === 'cancelled') return 'medium';
  return 'warning';
}

onIonViewWillEnter(loadReport);
</script>

<style scoped>
.content {
  width: min(100% - 32px, 720px);
  margin: 0 auto;
  padding: 8px 0 34px;
}

.intro {
  padding: 12px 0 18px;
}

.eyebrow {
  margin: 0 0 6px;
  color: #568b4e;
  font-size: 0.69rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}

h1 {
  margin: 0;
  font-size: 1.8rem;
}

.intro > p:last-child {
  margin: 8px 0 0;
  color: var(--ion-color-medium);
  line-height: 1.5;
}

.filters {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 17px;
  background: white;
  box-shadow: 0 4px 18px rgb(38 51 40 / 5%);
}

.download-section {
  display: grid;
  gap: 8px;
  margin-top: 16px;
  padding: 14px;
  border: 1px solid #dcebd8;
  border-radius: 16px;
  background: #f0f7ed;
}

.download-section p {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.84rem;
  text-align: center;
}

.download-section ion-button {
  margin: 0;
  font-weight: 700;
}

.quick-filters {
  display: flex;
  gap: 7px;
}

.quick-filters ion-button {
  margin: 0;
}

.date-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.date-fields ion-input {
  --background: #fbfcfa;
  --border-radius: 12px;
  --padding-start: 10px;
}

.date-error {
  margin: 0;
  color: var(--ion-color-danger);
  font-size: 0.84rem;
}

.range-caption {
  margin: -5px 0 0;
  color: var(--ion-color-medium);
  font-size: 0.78rem;
  text-align: center;
}

.loading {
  display: grid;
  min-height: 30vh;
  place-items: center;
  color: var(--ion-color-primary);
}

.error-state {
  padding: 25px 12px;
  color: var(--ion-color-danger);
  text-align: center;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
}

.metric {
  display: grid;
  min-height: 85px;
  align-content: center;
  gap: 6px;
  padding: 13px;
  border-radius: 14px;
  background: white;
}

.metric span {
  color: var(--ion-color-medium);
  font-size: 0.76rem;
}

.metric strong {
  font-size: 1.15rem;
}

.metric.primary {
  background: #eaf5e9;
}

.metric.primary strong {
  color: var(--ion-color-primary-shade);
}

.report-section {
  margin-top: 24px;
}

.section-heading {
  margin-bottom: 10px;
}

.section-heading h2 {
  margin: 0;
  font-size: 1.14rem;
}

.section-heading h2 span {
  color: var(--ion-color-medium);
  font-size: 0.9rem;
  font-weight: 400;
}

.daily-list {
  overflow: hidden;
  border-radius: 15px;
  background: white;
}

.daily-row {
  display: flex;
  min-height: 58px;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
}

.daily-row + .daily-row,
.report-order + .report-order {
  border-top: 1px solid var(--ion-border-color);
}

.daily-copy {
  display: grid;
  gap: 4px;
}

.daily-copy span,
.empty-note {
  color: var(--ion-color-medium);
  font-size: 0.8rem;
}

.report-order {
  padding: 14px;
}

.order-header,
.order-item,
.order-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.order-header > div {
  display: grid;
  gap: 4px;
}

.order-header span,
.order-item {
  color: var(--ion-color-medium);
  font-size: 0.82rem;
}

.order-item {
  margin-top: 10px;
}

.order-total {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--ion-border-color);
}

.empty-note {
  margin: 12px 0;
}

.report-note {
  margin: 18px 0 0;
  color: var(--ion-color-medium);
  font-size: 0.78rem;
  line-height: 1.5;
  text-align: center;
}

@media (min-width: 760px) {
  .content {
    width: min(100% - 48px, 900px);
  }

  .metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .filters {
    padding: 20px;
  }
}
</style>
