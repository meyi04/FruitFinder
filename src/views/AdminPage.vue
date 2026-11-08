<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Admin</ion-title>
        <ion-buttons slot="end">
          <ion-button aria-label="Refresh admin dashboard" :disabled="loading" @click="load">
            <ion-icon slot="icon-only" :icon="refreshOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <main class="content">
        <section class="intro">
          <p class="eyebrow">FRUITFINDER ADMINISTRATION</p>
          <h1>Community overview</h1>
          <p>Manage member profiles, monitor marketplace activity, and export date-filtered reports.</p>
        </section>

        <section class="report-filters">
          <div class="section-title">
            <div>
              <p class="eyebrow">REPORT PERIOD</p>
              <h2>Marketplace analytics</h2>
            </div>
          </div>
          <div class="presets">
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
          <div class="report-actions">
            <ion-button expand="block" :disabled="loading || Boolean(dateError)" @click="load">
              {{ loading ? 'Loading…' : 'Apply date range' }}
            </ion-button>
            <ion-button
              expand="block"
              :disabled="loading || downloadingPdf || Boolean(error) || Boolean(dateError)"
              @click="downloadPdfReport"
            >
              <ion-icon slot="start" :icon="downloadOutline" />
              {{ downloadingPdf ? 'Preparing PDF…' : 'Download branded PDF' }}
            </ion-button>
            <ion-button
              expand="block"
              fill="outline"
              :disabled="loading || Boolean(error) || Boolean(dateError)"
              @click="exportCsv"
            >
              <ion-icon slot="start" :icon="downloadOutline" />
              Export spreadsheet (CSV)
            </ion-button>
          </div>
          <p class="range-caption">Showing {{ rangeCaption }}</p>
        </section>

        <div v-if="loading" class="loading"><ion-spinner name="crescent" /></div>
        <section v-else-if="error" class="error-state">
          <p>{{ error }}</p>
          <ion-button @click="load">Try again</ion-button>
        </section>
        <template v-else>
          <section class="metrics">
            <article class="metric primary">
              <span>Completed sales</span>
              <strong>{{ money(analytics.completedRevenue) }}</strong>
            </article>
            <article class="metric">
              <span>Orders in period</span>
              <strong>{{ analytics.orderCount }}</strong>
            </article>
            <article class="metric">
              <span>Pending orders</span>
              <strong>{{ analytics.pendingCount }}</strong>
            </article>
            <article class="metric">
              <span>Community members</span>
              <strong>{{ analytics.userCount }}</strong>
            </article>
            <article class="metric">
              <span>Supplier stores</span>
              <strong>{{ analytics.supplierCount }}</strong>
            </article>
            <article class="metric">
              <span>Suspended accounts</span>
              <strong>{{ analytics.suspendedCount }}</strong>
            </article>
          </section>

          <div class="split-sections">
            <section class="panel">
              <div class="section-title">
                <div>
                  <p class="eyebrow">COMPLETED ORDERS</p>
                  <h2>Daily sales</h2>
                </div>
              </div>
              <div v-if="analytics.dailyRevenue.length" class="data-list">
                <div v-for="day in analytics.dailyRevenue" :key="day.date" class="data-row">
                  <span>{{ displayDate(day.date) }}</span>
                  <strong>{{ money(day.revenue) }}</strong>
                </div>
              </div>
              <p v-else class="empty-note">No completed sales in this date range.</p>
            </section>

            <section class="panel">
              <div class="section-title">
                <div>
                  <p class="eyebrow">TOP PERFORMERS</p>
                  <h2>Supplier sales</h2>
                </div>
              </div>
              <div v-if="analytics.topSuppliers.length" class="data-list">
                <div v-for="supplier in analytics.topSuppliers" :key="supplier.supplierId" class="data-row">
                  <div class="row-copy">
                    <strong>{{ supplier.name }}</strong>
                    <span>{{ supplier.orders }} completed orders</span>
                  </div>
                  <strong>{{ money(supplier.revenue) }}</strong>
                </div>
              </div>
              <p v-else class="empty-note">No completed supplier orders in this date range.</p>
            </section>
          </div>

          <section class="members panel">
            <div class="members-heading">
              <div>
                <p class="eyebrow">ACCOUNT MANAGEMENT</p>
                <h2>
                  Community members <span>({{ filteredUsers.length }})</span>
                </h2>
              </div>
              <ion-button fill="clear" size="small" :disabled="loading" @click="load"> Refresh </ion-button>
            </div>
            <ion-searchbar v-model="search" placeholder="Search name or email" :debounce="150" class="member-search" />
            <div class="member-filters">
              <ion-select v-model="roleFilter" aria-label="Filter by role" interface="popover">
                <ion-select-option value="all">All roles</ion-select-option>
                <ion-select-option value="buyer">Buyers</ion-select-option>
                <ion-select-option value="supplier">Suppliers</ion-select-option>
              </ion-select>
              <ion-select v-model="statusFilter" aria-label="Filter by account status" interface="popover">
                <ion-select-option value="all">All statuses</ion-select-option>
                <ion-select-option value="active">Active</ion-select-option>
                <ion-select-option value="suspended">Suspended</ion-select-option>
              </ion-select>
            </div>

            <div v-if="filteredUsers.length" class="member-list">
              <article v-for="user in filteredUsers" :key="user.uid" class="member-card">
                <div class="member-info">
                  <div class="avatar">{{ user.name?.slice(0, 1).toUpperCase() || '?' }}</div>
                  <div class="member-copy">
                    <strong>{{ user.name || 'Unnamed account' }}</strong>
                    <span>{{ user.email }}</span>
                    <span>{{ roleLabel(user.role) }} · {{ statusLabel(user) }}</span>
                  </div>
                </div>
                <div class="member-actions">
                  <ion-button size="small" fill="outline" @click="openEditor(user)">
                    <ion-icon slot="start" :icon="createOutline" /> Edit profile
                  </ion-button>
                  <ion-button
                    size="small"
                    :color="user.status === 'suspended' ? 'success' : 'danger'"
                    fill="clear"
                    @click="confirmStatusChange(user)"
                  >
                    {{ user.status === 'suspended' ? 'Restore' : 'Suspend' }}
                  </ion-button>
                </div>
              </article>
            </div>
            <EmptyState
              v-else
              title="No matching members"
              message="Try a different search or account filter."
              :icon="peopleOutline"
            />
          </section>

          <aside class="deletion-note">
            <ion-icon :icon="informationCircleOutline" />
            <div>
              <strong>Permanent account deletion</strong>
              <p>
                To avoid paid backend services, this dashboard can suspend or restore accounts but cannot delete a
                Firebase Authentication account. Permanently delete accounts in Firebase Console → Authentication →
                Users. Remove related Firestore records there as needed.
              </p>
            </div>
          </aside>
        </template>
      </main>
    </ion-content>

    <ion-modal :is-open="Boolean(editingUser)" @didDismiss="closeEditor">
      <ion-header>
        <ion-toolbar>
          <ion-title>Edit member profile</ion-title>
          <ion-buttons slot="end">
            <ion-button aria-label="Close editor" @click="closeEditor">Close</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <form class="editor-form" @submit.prevent="saveUser">
          <p class="editor-email">{{ editingUser?.email }}</p>
          <p class="editor-note">Email and account role are managed separately and cannot be changed here.</p>
          <ion-input
            v-model="editName"
            label="Full name"
            label-placement="stacked"
            autocomplete="name"
            required
            fill="outline"
          />
          <ion-input
            v-model="editPhone"
            label="Phone"
            label-placement="stacked"
            type="tel"
            autocomplete="tel"
            fill="outline"
          />
          <ion-input v-model="editMunicipality" label="Municipality" label-placement="stacked" fill="outline" />
          <ion-input v-model="editBarangay" label="Barangay" label-placement="stacked" fill="outline" />
          <ion-button expand="block" type="submit" :disabled="saving">
            {{ saving ? 'Saving…' : 'Save profile' }}
          </ion-button>
        </form>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { alertController } from '@ionic/vue';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonModal,
  IonPage,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { computed, onMounted, ref } from 'vue';
import {
  createOutline,
  downloadOutline,
  informationCircleOutline,
  peopleOutline,
  refreshOutline,
} from 'ionicons/icons';

import EmptyState from '@/components/EmptyState.vue';
import { errorMessage, showToast } from '@/composables/useAppToast';
import {
  listAdminOrders,
  listManagedSuppliers,
  listManagedUsers,
  setManagedUserStatus,
  updateManagedUser,
} from '@/services/adminService';
import type { AccountStatus, FruitOrder, Supplier, UserProfile, UserRole } from '@/types';
import { downloadBrandedReport } from '@/utils/brandedReportPdf';
import { formatReportDate } from '@/utils/orderAnalytics';
import { summarizeAdminData } from '@/utils/adminAnalytics';

const users = ref<UserProfile[]>([]);
const suppliers = ref<Supplier[]>([]);
const orders = ref<FruitOrder[]>([]);
const loading = ref(false);
const saving = ref(false);
const downloadingPdf = ref(false);
const error = ref('');
const search = ref('');
const roleFilter = ref<'all' | 'buyer' | 'supplier'>('all');
const statusFilter = ref<'all' | AccountStatus>('all');
const endDate = ref(formatReportDate(new Date()));
const startDate = ref(formatReportDate(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)));
const selectedPreset = ref('30');
const editingUser = ref<UserProfile | null>(null);
const editName = ref('');
const editPhone = ref('');
const editMunicipality = ref('');
const editBarangay = ref('');

const dateError = computed(() => {
  if (!startDate.value || !endDate.value) return 'Choose both a start and end date.';
  if (startDate.value > endDate.value) return 'Start date must be on or before the end date.';
  return '';
});
const rangeCaption = computed(() => `${displayDate(startDate.value)} – ${displayDate(endDate.value)}`);
const analytics = computed(() => summarizeAdminData(users.value, suppliers.value, orders.value));
const filteredUsers = computed(() => {
  const searchTerm = search.value.trim().toLocaleLowerCase();
  return users.value
    .filter((user) => user.role === 'buyer' || user.role === 'supplier')
    .filter((user) => roleFilter.value === 'all' || user.role === roleFilter.value)
    .filter(
      (user) =>
        statusFilter.value === 'all' || (user.status === 'suspended' ? 'suspended' : 'active') === statusFilter.value,
    )
    .filter((user) => !searchTerm || `${user.name} ${user.email}`.toLocaleLowerCase().includes(searchTerm))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
});

async function load(): Promise<void> {
  if (dateError.value) return;
  loading.value = true;
  error.value = '';
  try {
    const [userResults, supplierResults, orderResults] = await Promise.all([
      listManagedUsers(),
      listManagedSuppliers(),
      listAdminOrders(startDate.value, endDate.value),
    ]);
    users.value = userResults;
    suppliers.value = supplierResults;
    orders.value = orderResults;
  } catch (cause) {
    error.value = errorMessage(cause, 'Unable to load admin data.');
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
  void load();
}

function openEditor(user: UserProfile): void {
  editingUser.value = user;
  editName.value = user.name || '';
  editPhone.value = user.phone || '';
  editMunicipality.value = user.municipality || '';
  editBarangay.value = user.barangay || '';
}

function closeEditor(): void {
  editingUser.value = null;
}

async function saveUser(): Promise<void> {
  const user = editingUser.value;
  if (!user) return;
  if (editName.value.trim().length < 2) {
    await showToast('Enter a name with at least 2 characters.');
    return;
  }
  saving.value = true;
  try {
    const changes = {
      name: editName.value.trim(),
      phone: editPhone.value.trim(),
      municipality: editMunicipality.value.trim(),
      barangay: editBarangay.value.trim(),
    };
    await updateManagedUser(user.uid, changes);
    users.value = users.value.map((item) => (item.uid === user.uid ? { ...item, ...changes } : item));
    closeEditor();
    await showToast('Member profile updated.', 'success');
  } catch (cause) {
    await showToast(errorMessage(cause, 'Unable to update this member.'));
  } finally {
    saving.value = false;
  }
}

async function confirmStatusChange(user: UserProfile): Promise<void> {
  const nextStatus: AccountStatus = user.status === 'suspended' ? 'active' : 'suspended';
  const action = nextStatus === 'suspended' ? 'Suspend' : 'Restore';
  const alert = await alertController.create({
    header: `${action} account?`,
    message:
      nextStatus === 'suspended'
        ? `${user.name} will be unable to sign in while suspended. This does not delete their Firebase Authentication account.`
        : `Allow ${user.name} to sign in to FruitFinder again?`,
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      { text: action, role: 'confirm' },
    ],
  });
  await alert.present();
  const result = await alert.onDidDismiss();
  if (result.role !== 'confirm') return;

  try {
    await setManagedUserStatus(user.uid, nextStatus);
    users.value = users.value.map((item) => (item.uid === user.uid ? { ...item, status: nextStatus } : item));
    await showToast(`Account ${nextStatus === 'suspended' ? 'suspended' : 'restored'}.`, 'success');
  } catch (cause) {
    await showToast(errorMessage(cause, `Unable to ${action.toLocaleLowerCase()} this account.`));
  }
}

function csvCell(value: string | number): string {
  let text = String(value);
  if (/^[\t\r=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

async function downloadPdfReport(): Promise<void> {
  const report = analytics.value;
  downloadingPdf.value = true;
  try {
    await downloadBrandedReport({
      title: 'Marketplace administration report',
      dateRange: rangeCaption.value,
      filename: `fruitfinder-admin-report-${startDate.value}-to-${endDate.value}.pdf`,
      metrics: [
        { label: 'Completed sales', value: `PHP ${report.completedRevenue.toFixed(2)}` },
        { label: 'Orders in period', value: String(report.orderCount) },
        { label: 'Completed orders', value: String(report.completedCount) },
        { label: 'Pending orders', value: String(report.pendingCount) },
        { label: 'Community members', value: String(report.userCount) },
        { label: 'Buyers', value: String(report.buyerCount) },
        { label: 'Supplier accounts', value: String(report.supplierAccountCount) },
        { label: 'Suspended accounts', value: String(report.suspendedCount) },
        { label: 'Supplier stores', value: String(report.supplierCount) },
        { label: 'Active supplier stores', value: String(report.activeSupplierCount) },
        { label: 'Customers in period', value: String(report.customerCount) },
      ],
      sections: [
        {
          title: 'Daily sales',
          columns: ['Date', 'Revenue (PHP)'],
          rows: report.dailyRevenue.map((day) => [displayDate(day.date), day.revenue.toFixed(2)]),
        },
        {
          title: 'Top suppliers',
          columns: ['Supplier', 'Completed orders', 'Revenue (PHP)'],
          rows: report.topSuppliers.map((supplier) => [supplier.name, supplier.orders, supplier.revenue.toFixed(2)]),
        },
        {
          title: 'Orders in date range',
          columns: ['Order ID', 'Date', 'Buyer', 'Supplier', 'Status', 'Order type', 'Total (PHP)'],
          rows: orders.value.map((order) => [
            order.id,
            order.createdAt?.toDate().toLocaleDateString() || 'Date unavailable',
            order.buyerName,
            order.supplierName,
            order.status,
            order.orderType,
            order.total.toFixed(2),
          ]),
        },
      ],
    });
    await showToast('Branded FruitFinder PDF downloaded.', 'success');
  } catch (cause) {
    await showToast(errorMessage(cause, 'Unable to create the PDF report.'));
  } finally {
    downloadingPdf.value = false;
  }
}

async function exportCsv(): Promise<void> {
  const report = analytics.value;
  const rows: Array<Array<string | number>> = [
    ['FruitFinder marketplace report'],
    ['Date range', displayDate(startDate.value), 'to', displayDate(endDate.value)],
    ['Generated', new Date().toLocaleString()],
    [],
    ['SUMMARY'],
    ['Metric', 'Value'],
    ['Completed sales', report.completedRevenue.toFixed(2)],
    ['Orders in period', report.orderCount],
    ['Completed orders', report.completedCount],
    ['Pending orders', report.pendingCount],
    ['Community members', report.userCount],
    ['Buyers', report.buyerCount],
    ['Supplier accounts', report.supplierAccountCount],
    ['Suspended accounts', report.suspendedCount],
    ['Supplier stores', report.supplierCount],
    ['Active supplier stores', report.activeSupplierCount],
    ['Customers in period', report.customerCount],
    [],
    ['DAILY SALES'],
    ['Date', 'Revenue'],
    ...report.dailyRevenue.map((day) => [displayDate(day.date), day.revenue.toFixed(2)]),
    [],
    ['TOP SUPPLIERS'],
    ['Supplier', 'Completed orders', 'Revenue'],
    ...report.topSuppliers.map((supplier) => [supplier.name, supplier.orders, supplier.revenue.toFixed(2)]),
    [],
    ['ORDERS IN DATE RANGE'],
    ['Order ID', 'Date', 'Buyer', 'Supplier', 'Status', 'Order type', 'Total'],
    ...orders.value.map((order) => [
      order.id,
      order.createdAt?.toDate().toLocaleString() || 'Date unavailable',
      order.buyerName,
      order.supplierName,
      order.status,
      order.orderType,
      order.total.toFixed(2),
    ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `fruitfinder-admin-report-${startDate.value}-to-${endDate.value}.csv`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  await showToast('Admin report downloaded as CSV.', 'success');
}

function money(value: number): string {
  return `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function displayDate(value: string): string {
  if (!value) return '';
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function roleLabel(role: UserRole): string {
  return role === 'supplier' ? 'Supplier' : role === 'admin' ? 'Admin' : 'Buyer';
}

function statusLabel(user: UserProfile): string {
  return user.status === 'suspended' ? 'Suspended' : 'Active';
}

onMounted(load);
</script>

<style scoped>
.content {
  width: min(100% - 32px, 1040px);
  margin: 0 auto;
  padding: 8px 0 36px;
}

.intro {
  padding: 16px 0 18px;
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
  font-size: clamp(1.7rem, 7vw, 2.2rem);
}

.intro > p:last-child {
  margin: 8px 0 0;
  color: var(--ion-color-medium);
  line-height: 1.5;
}

.report-filters,
.panel {
  padding: 16px;
  border-radius: 18px;
  background: white;
  box-shadow: 0 4px 18px rgb(38 51 40 / 5%);
}

.section-title,
.members-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

h2 {
  margin: 0;
  font-size: 1.12rem;
}

.presets {
  display: flex;
  gap: 6px;
  margin: 12px 0;
}

.presets ion-button {
  margin: 0;
}

.date-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.date-fields ion-input,
.editor-form ion-input {
  --background: #fbfcfa;
  --border-radius: 12px;
  --padding-start: 10px;
}

.date-error,
.error-state {
  color: var(--ion-color-danger);
}

.report-actions {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.report-actions ion-button {
  margin: 0;
}

.range-caption {
  margin: 10px 0 0;
  color: var(--ion-color-medium);
  font-size: 0.8rem;
  text-align: center;
}

.loading {
  display: grid;
  min-height: 30vh;
  place-items: center;
  color: var(--ion-color-primary);
}

.error-state {
  padding: 24px 12px;
  text-align: center;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
  margin: 16px 0;
}

.metric {
  display: grid;
  min-width: 0;
  min-height: 78px;
  align-content: center;
  gap: 6px;
  padding: 12px;
  border-radius: 15px;
  background: white;
}

.metric span {
  color: var(--ion-color-medium);
  font-size: 0.75rem;
}

.metric strong {
  overflow-wrap: anywhere;
  font-size: clamp(1rem, 4vw, 1.3rem);
}

.metric.primary {
  background: #eaf5e9;
}

.metric.primary strong {
  color: var(--ion-color-primary-shade);
}

.split-sections {
  display: grid;
  gap: 14px;
}

.section-title {
  margin-bottom: 12px;
}

.data-list {
  overflow: hidden;
  border-radius: 13px;
  background: #f8faf7;
}

.data-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px;
  font-size: 0.85rem;
}

.data-row + .data-row {
  border-top: 1px solid var(--ion-border-color);
}

.row-copy,
.member-copy {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.row-copy span,
.empty-note {
  color: var(--ion-color-medium);
  font-size: 0.78rem;
}

.row-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
}

.members {
  margin-top: 16px;
}

.members-heading h2 span {
  color: var(--ion-color-medium);
  font-size: 0.85rem;
  font-weight: 400;
}

.member-search {
  padding: 0;
  margin-top: 10px;
  --background: #f8faf7;
  --border-radius: 12px;
}

.member-filters {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 10px 0;
}

.member-filters ion-select {
  min-height: 42px;
  border: 1px solid var(--ion-border-color);
  border-radius: 11px;
  padding: 0 9px;
  background: #fff;
  font-size: 0.82rem;
}

.member-list {
  display: grid;
  gap: 9px;
}

.member-card {
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--ion-border-color);
  border-radius: 14px;
}

.member-info {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.avatar {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  background: #eaf5e9;
  color: var(--ion-color-primary-shade);
  font-weight: 800;
}

.member-copy span {
  overflow: hidden;
  color: var(--ion-color-medium);
  font-size: 0.78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.member-actions ion-button {
  margin: 0;
}

.deletion-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 14px 0;
  padding: 14px;
  border: 1px solid #f2dfb6;
  border-radius: 14px;
  background: #fff8e9;
  color: #76500e;
  font-size: 0.82rem;
}

.deletion-note ion-icon {
  flex: 0 0 auto;
  font-size: 1.2rem;
}

.deletion-note p {
  margin: 5px 0 0;
  line-height: 1.5;
}

.editor-form {
  display: grid;
  gap: 14px;
  width: min(100% - 32px, 560px);
  margin: 0 auto;
  padding: 20px 0 32px;
}

.editor-email {
  margin: 0;
  font-weight: 700;
}

.editor-note {
  margin: -8px 0 0;
  color: var(--ion-color-medium);
  font-size: 0.83rem;
}

@media (min-width: 760px) {
  .content {
    width: min(100% - 48px, 1040px);
  }

  .metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .split-sections {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .member-card {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }
}
</style>
