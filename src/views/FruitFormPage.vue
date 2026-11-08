<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button default-href="/tabs/dashboard" /></ion-buttons>
        <ion-title>{{ isEditing ? 'Edit fruit' : 'Add a fruit' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="content">
        <div v-if="loading" class="loading"><ion-spinner name="crescent" /></div>
        <div v-else-if="error" class="error-state">
          <EmptyState title="Listing unavailable" :message="error">
            <ion-button router-link="/tabs/dashboard">Back to dashboard</ion-button>
          </EmptyState>
        </div>
        <form v-else class="fruit-form" @submit.prevent="save">
          <div class="form-intro">
            <div class="fruit-emoji">{{ isEditing ? '🍍' : '🥭' }}</div>
            <p class="eyebrow">{{ isEditing ? 'KEEP YOUR LISTING CURRENT' : 'SHARE WHAT’S IN SEASON' }}</p>
            <h1>{{ isEditing ? 'Update your fruit' : 'Add a fruit listing' }}</h1>
          </div>
          <ion-input
            v-model="name"
            label="Fruit name"
            label-placement="stacked"
            placeholder="e.g. Carabao mango"
            required
            fill="outline"
          />
          <ion-select v-model="category" label="Category" label-placement="stacked" interface="popover" fill="outline">
            <ion-select-option v-for="item in FRUIT_CATEGORIES" :key="item" :value="item">{{ item }}</ion-select-option>
          </ion-select>
          <div class="form-row">
            <ion-input
              v-model="price"
              label="Price (₱)"
              label-placement="stacked"
              type="number"
              min="0.01"
              step="0.01"
              inputmode="decimal"
              required
              fill="outline"
            />
            <ion-select v-model="unit" label="Unit" label-placement="stacked" interface="popover" fill="outline">
              <ion-select-option value="kg">Per kilogram</ion-select-option>
              <ion-select-option value="piece">Per piece</ion-select-option>
              <ion-select-option value="box">Per box</ion-select-option>
            </ion-select>
          </div>
          <ion-input
            v-model="minBulkQty"
            label="Minimum bulk quantity (optional)"
            label-placement="stacked"
            type="number"
            min="0"
            step="1"
            inputmode="numeric"
            fill="outline"
          />
          <ion-textarea
            v-model="description"
            label="Description"
            label-placement="stacked"
            placeholder="Describe the fruit, harvest, or pickup details."
            :maxlength="500"
            :counter="true"
            auto-grow
            fill="outline"
          />
          <div class="photo-upload">
            <input
              ref="photoInput"
              class="file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Choose a fruit photo"
              @change="handleImageSelected"
            />
            <div class="photo-heading">
              <div>
                <strong>Fruit photo</strong>
                <p>Choose a photo or take one with your camera. We’ll resize it to fit Firestore.</p>
              </div>
              <ion-button type="button" fill="outline" @click="choosePhoto">
                {{ processingPhoto ? 'Preparing…' : imageBase64 ? 'Change photo' : 'Choose photo' }}
              </ion-button>
            </div>
            <img
              v-if="imageBase64 || imageUrl"
              class="photo-preview"
              :src="imageBase64 || imageUrl"
              :alt="`${name || 'Fruit'} preview`"
            />
            <ion-button
              v-if="imageBase64"
              class="remove-photo"
              type="button"
              fill="clear"
              color="danger"
              @click="removePhoto"
            >
              Remove photo
            </ion-button>
          </div>
          <div class="stock-row">
            <div>
              <strong>Available now</strong>
              <p>Buyers can see if this fruit is in stock.</p>
            </div>
            <ion-toggle v-model="inStock" aria-label="Fruit is currently in stock" />
          </div>
          <ion-button expand="block" type="submit" :disabled="saving">
            {{ saving ? 'Saving…' : isEditing ? 'Save changes' : 'Add fruit listing' }}
          </ion-button>
        </form>
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
  IonContent,
  IonHeader,
  IonInput,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/vue';

import EmptyState from '@/components/EmptyState.vue';
import { errorMessage, showToast } from '@/composables/useAppToast';
import { createFruit, listFruits, updateFruit } from '@/services/fruitService';
import { useAuthStore } from '@/stores/authStore';
import { FRUIT_CATEGORIES } from '@/types';
import type { FruitCategory, FruitUnit } from '@/types';
import { compressImageToDataUrl } from '@/utils/imageCompression';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const fruitId = computed(() => (typeof route.params.fruitId === 'string' ? route.params.fruitId : ''));
const isEditing = computed(() => Boolean(fruitId.value));
const loading = ref(isEditing.value);
const saving = ref(false);
const error = ref('');
const name = ref('');
const category = ref<FruitCategory>('Tropical');
const price = ref('');
const unit = ref<FruitUnit>('kg');
const minBulkQty = ref('0');
const description = ref('');
const imageUrl = ref('');
const imageBase64 = ref('');
const photoInput = ref<HTMLInputElement | null>(null);
const processingPhoto = ref(false);
const inStock = ref(true);

function choosePhoto(): void {
  photoInput.value?.click();
}

async function handleImageSelected(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  processingPhoto.value = true;
  try {
    chooseNewPhoto(await compressImageToDataUrl(file));
    await showToast('Photo ready to save with your listing.', 'success');
  } catch (cause) {
    await showToast(errorMessage(cause, 'Unable to prepare this photo.'));
  } finally {
    processingPhoto.value = false;
  }
}

function removePhoto(): void {
  imageBase64.value = '';
  imageUrl.value = '';
}

function chooseNewPhoto(dataUrl: string): void {
  imageBase64.value = dataUrl;
  imageUrl.value = '';
}

async function loadListing(): Promise<void> {
  if (!isEditing.value) {
    loading.value = false;
    error.value = '';
    return;
  }
  const uid = authStore.profile?.uid;
  if (!uid) {
    loading.value = false;
    error.value = 'Sign in with a supplier account to manage fruit listings.';
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    const fruit = (await listFruits(uid)).find((item) => item.id === fruitId.value);
    if (!fruit) throw new Error('This fruit listing could not be found.');
    name.value = fruit.name;
    category.value = fruit.category;
    price.value = String(fruit.price);
    unit.value = fruit.unit;
    minBulkQty.value = String(fruit.minBulkQty || 0);
    description.value = fruit.description || '';
    imageUrl.value = fruit.imageUrl || '';
    imageBase64.value = fruit.imageBase64 || '';
    inStock.value = fruit.inStock;
  } catch (cause) {
    error.value = errorMessage(cause, 'Unable to load this fruit listing.');
  } finally {
    loading.value = false;
  }
}

watch(fruitId, loadListing, { immediate: true });

async function save(): Promise<void> {
  const uid = authStore.profile?.uid;
  if (!uid) return;
  const priceValue = Number(price.value);
  const bulkValue = Number(minBulkQty.value || 0);
  if (!name.value.trim()) {
    await showToast('Enter the fruit name.');
    return;
  }
  if (!Number.isFinite(priceValue) || priceValue <= 0) {
    await showToast('Enter a valid price greater than zero.');
    return;
  }
  if (!Number.isInteger(bulkValue) || bulkValue < 0) {
    await showToast('Minimum bulk quantity must be a whole number or zero.');
    return;
  }
  if (processingPhoto.value) {
    await showToast('Wait for your photo to finish preparing.');
    return;
  }

  saving.value = true;
  try {
    const input = {
      name: name.value.trim(),
      category: category.value,
      price: priceValue,
      unit: unit.value,
      inStock: inStock.value,
      minBulkQty: bulkValue,
      description: description.value.trim(),
      imageUrl: imageUrl.value.trim(),
      imageBase64: imageBase64.value,
    };
    if (isEditing.value) await updateFruit(uid, fruitId.value, input);
    else await createFruit(uid, input);
    await showToast(isEditing.value ? 'Fruit listing updated.' : 'Fruit listing added.', 'success');
    await router.replace('/tabs/dashboard');
  } catch (cause) {
    await showToast(errorMessage(cause, 'Unable to save this fruit listing.'));
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.content {
  width: min(100% - 32px, 560px);
  margin: 0 auto;
  padding-bottom: 32px;
}

.loading {
  display: grid;
  min-height: 50vh;
  place-items: center;
  color: var(--ion-color-primary);
}

.fruit-form {
  display: grid;
  gap: 15px;
  margin-top: 10px;
  padding: 18px;
  border-radius: 18px;
  background: white;
}

.form-intro {
  text-align: center;
}

.fruit-emoji {
  display: grid;
  width: 62px;
  height: 62px;
  margin: 0 auto 12px;
  place-items: center;
  border-radius: 20px;
  background: #fff1d7;
  font-size: 32px;
}

.eyebrow {
  margin: 0 0 5px;
  color: #568b4e;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}

h1 {
  margin: 0 0 8px;
  font-size: 1.4rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 10px;
}

ion-input,
ion-select,
ion-textarea {
  --background: #fbfcfa;
  --border-radius: 12px;
  --padding-start: 12px;
}

.photo-upload {
  display: grid;
  gap: 10px;
  padding: 14px;
  border: 1px dashed #b9ceb5;
  border-radius: 14px;
  background: #fbfcfa;
}

.file-input {
  display: none;
}

.photo-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.photo-heading p {
  margin: 4px 0 0;
  color: var(--ion-color-medium);
  font-size: 0.8rem;
  line-height: 1.4;
}

.photo-heading ion-button {
  flex: 0 0 auto;
  margin: 0;
}

.photo-preview {
  width: 100%;
  max-height: 240px;
  border-radius: 12px;
  object-fit: cover;
}

.remove-photo {
  justify-self: start;
  margin: 0;
}

.stock-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: #f5f8f3;
}

.stock-row p {
  margin: 4px 0 0;
  color: var(--ion-color-medium);
  font-size: 0.82rem;
}

.error-state {
  text-align: center;
}
</style>
