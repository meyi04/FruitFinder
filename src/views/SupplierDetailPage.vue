<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button default-href="/tabs/suppliers" /></ion-buttons>
        <ion-title>{{ supplier?.businessName || 'Supplier details' }}</ion-title>
        <ion-buttons v-if="canFavorite" slot="end">
          <ion-button :aria-label="isFavorite ? 'Remove favorite' : 'Add favorite'" @click="toggleFavorite">
            <ion-icon slot="icon-only" :icon="isFavorite ? heart : heartOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div v-if="loading" class="loading"><ion-spinner name="crescent" /></div>
      <div v-else-if="error" class="content error">
        <EmptyState title="Supplier unavailable" :message="error">
          <ion-button @click="load">Try again</ion-button>
        </EmptyState>
      </div>
      <div v-else-if="supplier" class="content">
        <section class="hero">
          <div class="hero-art">🍊🍍🥭</div>
          <p class="eyebrow">{{ location || 'LOCAL FRUIT SUPPLIER' }}</p>
          <h1>{{ supplier.businessName }}</h1>
          <p class="description">{{ supplier.description || 'Fresh fruit from your local community.' }}</p>
          <div class="rating">
            <RatingStars :rating="averageRating" />
            <span>{{ reviewCount }} {{ reviewCount === 1 ? 'review' : 'reviews' }}</span>
          </div>
        </section>

        <section v-if="canOrder" class="contact-actions">
          <ion-button expand="block" @click="messageSupplier">
            <ion-icon slot="start" :icon="chatbubbleOutline" /> Message supplier
          </ion-button>
          <ion-button expand="block" fill="outline" router-link="/tabs/activity">
            <ion-icon slot="start" :icon="receiptOutline" /> My orders
          </ion-button>
        </section>

        <ion-card v-if="address || supplier.phone" class="info-card">
          <ion-card-content>
            <p v-if="address"><ion-icon :icon="locationOutline" /> {{ address }}</p>
            <p v-if="supplier.phone"><ion-icon :icon="callOutline" /> {{ supplier.phone }}</p>
            <p class="order-types">Accepts: {{ supplier.orderTypes?.join(', ') || 'Retail orders' }}</p>
          </ion-card-content>
        </ion-card>

        <section class="section">
          <div class="heading-row">
            <div>
              <p class="eyebrow">FRESH FROM THIS SELLER</p>
              <h2>Available fruits</h2>
            </div>
            <ion-button v-if="isOwner" fill="clear" router-link="/tabs/dashboard">Manage</ion-button>
          </div>
          <ion-progress-bar v-if="fruitLoading" type="indeterminate" />
          <div v-else-if="fruits.length" class="fruit-list">
            <div v-for="fruit in fruits" :key="fruit.id" class="fruit-order-row">
              <FruitItem :fruit="fruit" />
              <div v-if="canOrder && fruit.inStock" class="quantity-row">
                <span>Order quantity</span>
                <div class="quantity-control">
                  <ion-button
                    fill="outline"
                    size="small"
                    :disabled="!quantities[fruit.id]"
                    :aria-label="`Remove one ${fruit.name}`"
                    @click="adjustQuantity(fruit, -1)"
                    >−</ion-button
                  >
                  <strong>{{ quantities[fruit.id] || 0 }}</strong>
                  <ion-button
                    fill="outline"
                    size="small"
                    :aria-label="`Add one ${fruit.name}`"
                    @click="adjustQuantity(fruit, 1)"
                    >+</ion-button
                  >
                </div>
              </div>
              <p v-else-if="canOrder" class="out-of-stock">Currently unavailable</p>
            </div>
          </div>
          <p v-else class="muted">No fruit listings have been added yet.</p>
        </section>

        <section v-if="canOrder && selectedItems.length" class="section order-card">
          <p class="eyebrow">YOUR ORDER REQUEST</p>
          <h2>Review your order</h2>
          <div v-for="item in selectedItems" :key="item.fruitId" class="order-line">
            <span>{{ item.quantity }} × {{ item.name }}</span>
            <strong>₱{{ item.subtotal.toFixed(2) }}</strong>
          </div>
          <div class="order-total">
            <span>Estimated total</span><strong>₱{{ orderTotal.toFixed(2) }}</strong>
          </div>
          <ion-select
            v-model="orderType"
            label="Order type"
            label-placement="stacked"
            interface="popover"
            fill="outline"
          >
            <ion-select-option v-for="type in availableOrderTypes" :key="type" :value="type">
              {{ typeLabel(type) }}
            </ion-select-option>
          </ion-select>
          <p v-if="orderItemLimitReached" class="order-hint">Orders can include up to 30 different fruit listings.</p>
          <p v-else-if="orderType === 'bulk' && bulkQuantityError" class="order-hint">
            Bulk minimums: {{ bulkQuantityError }}
          </p>
          <ion-textarea
            v-model="orderNote"
            label="Note for supplier (optional)"
            label-placement="stacked"
            placeholder="Pickup date, delivery questions, or other details"
            :maxlength="500"
            :counter="true"
            fill="outline"
            auto-grow
          />
          <ion-button
            expand="block"
            :disabled="placingOrder || Boolean(bulkQuantityError) || orderItemLimitReached"
            @click="placeOrder"
          >
            {{ placingOrder ? 'Sending order…' : 'Send order request' }}
          </ion-button>
          <p class="muted payment-note">
            This is an order request, not a payment. Confirm pickup, delivery, and payment with the supplier in chat.
          </p>
        </section>

        <section class="section reviews">
          <div class="heading-row">
            <div>
              <p class="eyebrow">COMMUNITY FEEDBACK</p>
              <h2>Reviews</h2>
            </div>
          </div>
          <form v-if="canReview && !ownReview" class="review-form" @submit.prevent="submitReview">
            <h3>Share your experience</h3>
            <ion-select
              v-model="rating"
              label="Your rating"
              label-placement="stacked"
              interface="popover"
              fill="outline"
            >
              <ion-select-option v-for="value in 5" :key="value" :value="value"
                >{{ value }} {{ value === 1 ? 'star' : 'stars' }}</ion-select-option
              >
            </ion-select>
            <ion-textarea
              v-model="comment"
              label="Your review"
              label-placement="stacked"
              placeholder="What should other buyers know?"
              :maxlength="500"
              :counter="true"
              fill="outline"
              auto-grow
            />
            <ion-button type="submit" :disabled="reviewSubmitting">{{
              reviewSubmitting ? 'Posting…' : 'Post review'
            }}</ion-button>
          </form>
          <p v-else-if="ownReview" class="muted">You’ve already reviewed this supplier. Thanks for sharing!</p>
          <p v-else-if="authStore.profile?.role === 'supplier'" class="muted">Supplier accounts can’t leave reviews.</p>
          <div v-if="reviews.length" class="review-list">
            <article v-for="review in reviews" :key="review.id" class="review">
              <div class="review-heading">
                <strong>{{ review.buyerName }}</strong
                ><RatingStars :rating="review.rating" :show-value="false" />
              </div>
              <p v-if="review.comment">{{ review.comment }}</p>
            </article>
          </div>
          <p v-else class="muted">No reviews yet. Be the first to share your experience.</p>
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonProgressBar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { callOutline, chatbubbleOutline, heart, heartOutline, locationOutline, receiptOutline } from 'ionicons/icons';

import EmptyState from '@/components/EmptyState.vue';
import FruitItem from '@/components/FruitItem.vue';
import RatingStars from '@/components/RatingStars.vue';
import { errorMessage, showToast } from '@/composables/useAppToast';
import { listFruits } from '@/services/fruitService';
import { startConversation } from '@/services/messageService';
import { createOrder } from '@/services/orderService';
import { createReview, listReviews } from '@/services/reviewService';
import { getSupplier } from '@/services/supplierService';
import { useAuthStore } from '@/stores/authStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import type { FruitListing, OrderItem, OrderType, Supplier, SupplierReview } from '@/types';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const favoritesStore = useFavoritesStore();
const supplierId = computed(() => String(route.params.supplierId));
const supplier = ref<Supplier | null>(null);
const fruits = ref<FruitListing[]>([]);
const reviews = ref<SupplierReview[]>([]);
const loading = ref(true);
const fruitLoading = ref(true);
const error = ref('');
const rating = ref(5);
const comment = ref('');
const reviewSubmitting = ref(false);
const quantities = ref<Record<string, number>>({});
const orderType = ref<OrderType>('retail');
const orderNote = ref('');
const placingOrder = ref(false);

const canFavorite = computed(() => authStore.profile?.role === 'buyer');
const canOrder = computed(() => authStore.profile?.role === 'buyer' && authStore.profile.uid !== supplierId.value);
const canReview = computed(() => authStore.profile?.role === 'buyer');
const isFavorite = computed(() => favoritesStore.ids.includes(supplierId.value));
const isOwner = computed(() => authStore.profile?.uid === supplierId.value && authStore.profile?.role === 'supplier');
const ownReview = computed(() => reviews.value.some((review) => review.id === authStore.profile?.uid));
const availableOrderTypes = computed<OrderType[]>(() =>
  supplier.value?.orderTypes?.length ? supplier.value.orderTypes : ['retail'],
);
const selectedItems = computed<OrderItem[]>(() =>
  fruits.value
    .filter((fruit) => fruit.inStock && (quantities.value[fruit.id] || 0) > 0)
    .map((fruit) => {
      const quantity = quantities.value[fruit.id] || 0;
      return {
        fruitId: fruit.id,
        name: fruit.name,
        price: fruit.price,
        unit: fruit.unit,
        quantity,
        subtotal: Math.round(fruit.price * quantity * 100) / 100,
      };
    }),
);
const orderTotal = computed(() => selectedItems.value.reduce((sum, item) => sum + item.subtotal, 0));
const bulkQuantityError = computed(() => {
  if (orderType.value !== 'bulk') return '';
  return selectedItems.value
    .filter((item) => {
      const fruit = fruits.value.find((entry) => entry.id === item.fruitId);
      return fruit && fruit.minBulkQty > 0 && item.quantity < fruit.minBulkQty;
    })
    .map((item) => {
      const fruit = fruits.value.find((entry) => entry.id === item.fruitId);
      return `${item.name}: ${fruit?.minBulkQty} ${fruit?.unit}`;
    })
    .join(' · ');
});
const orderItemLimitReached = computed(() => selectedItems.value.length > 30);
const location = computed(() => [supplier.value?.barangay, supplier.value?.municipality].filter(Boolean).join(', '));
const address = computed(() => [supplier.value?.address, location.value].filter(Boolean).join(', '));
const averageRating = computed(() => {
  if (reviews.value.length) return reviews.value.reduce((sum, review) => sum + review.rating, 0) / reviews.value.length;
  return 0;
});
const reviewCount = computed(() => reviews.value.length);

async function load(): Promise<void> {
  loading.value = true;
  fruitLoading.value = true;
  error.value = '';
  try {
    const result = await getSupplier(supplierId.value);
    if (!result || result.isActive === false) throw new Error('This supplier is not available.');
    supplier.value = result;
    if (!result.orderTypes?.includes(orderType.value)) {
      orderType.value = result.orderTypes?.[0] || 'retail';
    }
    const [fruitResults, reviewResults] = await Promise.all([
      listFruits(supplierId.value),
      listReviews(supplierId.value),
    ]);
    fruits.value = fruitResults;
    reviews.value = reviewResults;
  } catch (cause) {
    error.value = errorMessage(cause, 'Unable to load supplier details.');
  } finally {
    loading.value = false;
    fruitLoading.value = false;
  }
}

function adjustQuantity(fruit: FruitListing, amount: number): void {
  const updated = Math.max(0, (quantities.value[fruit.id] || 0) + amount);
  quantities.value = { ...quantities.value, [fruit.id]: updated };
}

function typeLabel(type: OrderType): string {
  return type === 'events' ? 'Events' : type === 'bulk' ? 'Bulk order' : 'Retail';
}

async function messageSupplier(): Promise<void> {
  const buyer = authStore.profile;
  if (!buyer || !supplier.value) return;
  try {
    const conversationId = await startConversation(supplier.value, buyer);
    await router.push(`/messages/${conversationId}`);
  } catch (cause) {
    await showToast(errorMessage(cause, 'Unable to start a conversation.'));
  }
}

async function placeOrder(): Promise<void> {
  const buyer = authStore.profile;
  if (!buyer || !supplier.value || !selectedItems.value.length) return;
  if (!availableOrderTypes.value.includes(orderType.value)) {
    await showToast('This supplier does not accept that order type.');
    return;
  }
  if (bulkQuantityError.value) {
    await showToast(`Meet the supplier’s bulk minimums: ${bulkQuantityError.value}`);
    return;
  }

  placingOrder.value = true;
  try {
    const result = await createOrder({
      supplierId: supplier.value.id,
      supplierName: supplier.value.businessName,
      buyer,
      items: selectedItems.value,
      orderType: orderType.value,
      note: orderNote.value,
    });
    await showToast('Order request sent. Chat with the supplier to confirm details.', 'success');
    await router.push(`/messages/${result.conversationId}`);
  } catch (cause) {
    await showToast(errorMessage(cause, 'Unable to send your order request.'));
  } finally {
    placingOrder.value = false;
  }
}

async function toggleFavorite(): Promise<void> {
  const uid = authStore.profile?.uid;
  if (!uid) return;
  try {
    await favoritesStore.toggle(uid, supplierId.value);
    await showToast(isFavorite.value ? 'Added to your favorites.' : 'Removed from your favorites.', 'success');
  } catch (cause) {
    await showToast(errorMessage(cause, 'Unable to update your favorites.'));
  }
}

async function submitReview(): Promise<void> {
  if (!authStore.profile) return;
  if (comment.value.trim().length > 500) {
    await showToast('Reviews must be 500 characters or less.');
    return;
  }
  reviewSubmitting.value = true;
  try {
    await createReview(supplierId.value, authStore.profile, rating.value, comment.value);
    reviews.value = await listReviews(supplierId.value);
    comment.value = '';
    await showToast('Thanks for sharing your review.', 'success');
  } catch (cause) {
    await showToast(errorMessage(cause, 'Unable to post your review.'));
  } finally {
    reviewSubmitting.value = false;
  }
}

async function initializeDetail(): Promise<void> {
  if (canFavorite.value && authStore.profile) {
    try {
      await favoritesStore.load(authStore.profile.uid);
    } catch (cause) {
      await showToast(errorMessage(cause, 'Unable to load favorites.'));
    }
  }
  await load();
}

watch(supplierId, initializeDetail, { immediate: true });
</script>

<style scoped>
.content {
  width: min(100% - 32px, 720px);
  margin: 0 auto;
  padding-bottom: 36px;
}

.loading {
  display: grid;
  min-height: 55vh;
  place-items: center;
  color: var(--ion-color-primary);
}

.hero {
  padding: 18px 0 14px;
  text-align: center;
}

.hero-art {
  display: grid;
  min-height: 135px;
  margin-bottom: 18px;
  place-items: center;
  border-radius: 22px;
  background: linear-gradient(135deg, #e6f4df, #fff2d6);
  font-size: 46px;
  letter-spacing: 8px;
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
  font-size: 1.8rem;
}

.description {
  max-width: 520px;
  margin: 9px auto;
  color: var(--ion-color-medium);
  line-height: 1.5;
}

.rating {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--ion-color-medium);
  font-size: 0.84rem;
}

.contact-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
  margin: 8px 0 16px;
}

.contact-actions ion-button {
  margin: 0;
}

.info-card {
  margin: 0;
}

.info-card p {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin: 8px 0;
}

.info-card ion-icon {
  flex: 0 0 auto;
  margin-top: 2px;
  color: var(--ion-color-primary);
}

.info-card .order-types {
  color: var(--ion-color-medium);
  text-transform: capitalize;
}

.section {
  margin-top: 28px;
}

.heading-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

h2 {
  margin: 0;
  font-size: 1.2rem;
}

.fruit-list {
  padding: 8px 14px;
  border-radius: 16px;
  background: white;
}

.fruit-order-row + .fruit-order-row {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--ion-border-color);
}

.quantity-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 4px 60px;
  color: var(--ion-color-medium);
  font-size: 0.84rem;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--ion-text-color);
}

.quantity-control ion-button {
  width: 34px;
  height: 34px;
  margin: 0;
  --border-radius: 10px;
}

.out-of-stock {
  margin: 0 0 4px 60px;
  color: var(--ion-color-medium);
  font-size: 0.8rem;
}

.order-card {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  background: white;
  box-shadow: 0 4px 18px rgb(38 51 40 / 5%);
}

.order-card h2 {
  margin: 0;
}

.order-line,
.order-total {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.order-total {
  padding-top: 10px;
  border-top: 1px solid var(--ion-border-color);
  font-size: 1.05rem;
}

.order-total strong {
  color: var(--ion-color-primary-shade);
}

.order-hint {
  margin: -4px 0 0;
  color: var(--ion-color-danger);
  font-size: 0.82rem;
}

.order-card ion-select,
.order-card ion-textarea {
  --background: #fbfcfa;
  --border-radius: 12px;
}

.payment-note {
  margin: 0;
  font-size: 0.78rem;
}

.muted {
  color: var(--ion-color-medium);
  line-height: 1.5;
}

.review-form {
  display: grid;
  gap: 12px;
  margin: 14px 0;
  padding: 16px;
  border-radius: 16px;
  background: white;
}

h3 {
  margin: 0;
  font-size: 1rem;
}

.review-form ion-select,
.review-form ion-textarea {
  --background: #fbfcfa;
  --border-radius: 12px;
}

.review-list {
  display: grid;
  gap: 10px;
}

.review {
  padding: 14px;
  border-radius: 14px;
  background: white;
}

.review-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.review p {
  margin: 10px 0 0;
  line-height: 1.5;
  white-space: pre-wrap;
}

.error {
  text-align: center;
}
</style>
