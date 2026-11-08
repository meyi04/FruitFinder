<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ profile?.role === 'supplier' ? 'Store activity' : 'Your activity' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button v-if="profile?.role === 'supplier'" aria-label="Sales reports" router-link="/tabs/reports">
            <ion-icon slot="icon-only" :icon="barChartOutline" />
          </ion-button>
          <ion-button v-if="activeSection === 'orders'" aria-label="Messages" @click="activeSection = 'messages'">
            <ion-icon slot="icon-only" :icon="chatbubbleEllipsesOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment v-model="activeSection">
          <ion-segment-button value="orders"><ion-label>Orders</ion-label></ion-segment-button>
          <ion-segment-button value="messages"><ion-label>Messages</ion-label></ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="content">
        <ion-progress-bar v-if="loading" type="indeterminate" />
        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
          <ion-button @click="load">Try again</ion-button>
        </div>

        <template v-else-if="activeSection === 'orders'">
          <div v-if="orders.length" class="list">
            <ion-card v-for="order in orders" :key="order.id" class="order-card">
              <ion-card-content>
                <div class="card-heading">
                  <div>
                    <p class="eyebrow">{{ profile?.role === 'supplier' ? 'ORDER FROM' : 'ORDER WITH' }}</p>
                    <h2>{{ profile?.role === 'supplier' ? order.buyerName : order.supplierName }}</h2>
                  </div>
                  <ion-badge :color="statusColor(order.status)">{{ statusLabel(order.status) }}</ion-badge>
                </div>
                <div class="order-items">
                  <div v-for="item in order.items" :key="item.fruitId" class="order-line">
                    <span
                      >{{ item.quantity }} × {{ item.name }} <small>/ {{ item.unit }}</small></span
                    >
                    <strong>₱{{ item.subtotal.toFixed(2) }}</strong>
                  </div>
                </div>
                <div class="order-summary">
                  <span>{{ typeLabel(order.orderType) }} · {{ formatDate(order.createdAt) }}</span>
                  <strong>₱{{ order.total.toFixed(2) }}</strong>
                </div>
                <p v-if="order.note" class="order-note"><strong>Note:</strong> {{ order.note }}</p>
                <div class="actions">
                  <ion-button fill="outline" @click="openChat(order)">
                    <ion-icon slot="start" :icon="chatbubbleEllipsesOutline" /> Message
                  </ion-button>
                  <template v-if="profile?.role === 'supplier' && order.status === 'pending'">
                    <ion-button :disabled="updatingOrder === order.id" @click="changeStatus(order, 'accepted')"
                      >Accept</ion-button
                    >
                    <ion-button
                      fill="clear"
                      color="danger"
                      :disabled="updatingOrder === order.id"
                      @click="changeStatus(order, 'declined')"
                      >Decline</ion-button
                    >
                  </template>
                  <ion-button
                    v-if="profile?.role === 'supplier' && order.status === 'accepted'"
                    :disabled="updatingOrder === order.id"
                    @click="changeStatus(order, 'completed')"
                    >Mark complete</ion-button
                  >
                  <ion-button
                    v-if="profile?.role === 'buyer' && order.status === 'pending'"
                    fill="clear"
                    color="danger"
                    :disabled="updatingOrder === order.id"
                    @click="changeStatus(order, 'cancelled')"
                    >Cancel</ion-button
                  >
                </div>
              </ion-card-content>
            </ion-card>
          </div>
          <EmptyState
            v-else
            :title="profile?.role === 'supplier' ? 'No orders yet' : 'Your orders will show here'"
            :message="
              profile?.role === 'supplier'
                ? 'Buyer order requests will appear here.'
                : 'Explore a supplier and send your first order request.'
            "
            :icon="receiptOutline"
          >
            <ion-button v-if="profile?.role === 'buyer'" router-link="/tabs/suppliers">Browse suppliers</ion-button>
          </EmptyState>
        </template>

        <template v-else>
          <div v-if="conversations.length" class="list">
            <ion-card
              v-for="conversation in conversations"
              :key="conversation.id"
              class="conversation-card"
              button
              @click="openConversation(conversation)"
            >
              <ion-card-content>
                <div class="conversation-avatar">{{ otherName(conversation).slice(0, 1).toUpperCase() }}</div>
                <div class="conversation-content">
                  <div class="conversation-heading">
                    <strong>{{ otherName(conversation) }}</strong>
                    <small>{{ formatDate(conversation.lastMessageAt) }}</small>
                  </div>
                  <p>{{ conversation.lastMessage || 'Conversation started. Send a message to get things moving.' }}</p>
                </div>
                <ion-icon :icon="chevronForwardOutline" />
              </ion-card-content>
            </ion-card>
          </div>
          <EmptyState
            v-else
            title="No messages yet"
            message="Open a supplier and tap Message supplier to discuss fruit, pickup, and transactions."
            :icon="chatbubbleEllipsesOutline"
          >
            <ion-button router-link="/tabs/suppliers">Find a supplier</ion-button>
          </EmptyState>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onIonViewWillEnter } from '@ionic/vue';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonPage,
  IonProgressBar,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { barChartOutline, chatbubbleEllipsesOutline, chevronForwardOutline, receiptOutline } from 'ionicons/icons';

import EmptyState from '@/components/EmptyState.vue';
import { errorMessage, showToast } from '@/composables/useAppToast';
import { listConversations } from '@/services/messageService';
import { listOrders, updateOrderStatus } from '@/services/orderService';
import { useAuthStore } from '@/stores/authStore';
import type { Conversation, FruitOrder, OrderStatus, OrderType } from '@/types';

const authStore = useAuthStore();
const router = useRouter();
const profile = computed(() => authStore.profile);
const activeSection = ref<'orders' | 'messages'>('orders');
const orders = ref<FruitOrder[]>([]);
const conversations = ref<Conversation[]>([]);
const loading = ref(true);
const error = ref('');
const updatingOrder = ref('');

async function load(): Promise<void> {
  const user = authStore.profile;
  if (!user) return;
  loading.value = true;
  error.value = '';
  try {
    const [orderResults, conversationResults] = await Promise.all([
      listOrders(user.uid, user.role),
      listConversations(user.uid),
    ]);
    orders.value = orderResults;
    conversations.value = conversationResults;
  } catch (cause) {
    error.value = errorMessage(cause, 'Unable to load your activity.');
  } finally {
    loading.value = false;
  }
}

function otherName(conversation: Conversation): string {
  return authStore.profile?.role === 'supplier' ? conversation.buyerName : conversation.supplierName;
}

function statusLabel(status: OrderStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusColor(status: OrderStatus): string {
  if (status === 'accepted' || status === 'completed') return 'success';
  if (status === 'declined' || status === 'cancelled') return 'medium';
  return 'warning';
}

function typeLabel(type: OrderType): string {
  return type === 'events' ? 'Event order' : type === 'bulk' ? 'Bulk order' : 'Retail';
}

function formatDate(timestamp?: { toDate: () => Date }): string {
  if (!timestamp) return 'Just now';
  return timestamp.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

async function openChat(order: FruitOrder): Promise<void> {
  try {
    await router.push(`/messages/${order.conversationId}`);
  } catch (cause) {
    await showToast(errorMessage(cause, 'Unable to open messages.'));
  }
}

async function openConversation(conversation: Conversation): Promise<void> {
  await router.push(`/messages/${conversation.id}`);
}

async function changeStatus(order: FruitOrder, status: OrderStatus): Promise<void> {
  updatingOrder.value = order.id;
  try {
    await updateOrderStatus(order.id, status);
    await showToast(`Order ${statusLabel(status).toLowerCase()}.`, 'success');
    await load();
  } catch (cause) {
    await showToast(errorMessage(cause, 'Unable to update this order.'));
  } finally {
    updatingOrder.value = '';
  }
}

onIonViewWillEnter(load);
</script>

<style scoped>
.content {
  width: min(100% - 28px, 720px);
  margin: 0 auto;
  padding: 12px 0 28px;
}

.list {
  display: grid;
  gap: 12px;
}

.order-card,
.conversation-card {
  margin: 0;
  border-radius: 16px;
}

.order-card ion-card-content {
  padding: 16px;
}

.card-heading,
.order-summary,
.order-line,
.conversation-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.eyebrow {
  margin: 0 0 5px;
  color: #568b4e;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.09em;
}

h2 {
  margin: 0;
  font-size: 1.08rem;
}

.order-items {
  display: grid;
  gap: 8px;
  margin-top: 15px;
}

.order-line {
  color: var(--ion-text-color);
  font-size: 0.9rem;
}

.order-line small,
.order-summary span,
.conversation-heading small {
  color: var(--ion-color-medium);
}

.order-summary {
  margin-top: 13px;
  padding-top: 11px;
  border-top: 1px solid var(--ion-border-color);
  font-size: 0.82rem;
}

.order-note {
  margin: 12px 0 0;
  padding: 10px;
  border-radius: 10px;
  background: #f7faf6;
  font-size: 0.86rem;
  white-space: pre-wrap;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 13px;
}

.actions ion-button {
  margin: 0;
  font-size: 0.82rem;
}

.conversation-card ion-card-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.conversation-avatar {
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  background: #e7f4e3;
  color: var(--ion-color-primary-shade);
  font-size: 1.15rem;
  font-weight: 700;
}

.conversation-content {
  min-width: 0;
  flex: 1;
}

.conversation-heading {
  font-size: 0.94rem;
}

.conversation-content p {
  overflow: hidden;
  margin: 5px 0 0;
  color: var(--ion-color-medium);
  font-size: 0.82rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.error-state {
  padding: 28px 12px;
  color: var(--ion-color-danger);
  text-align: center;
}
</style>
