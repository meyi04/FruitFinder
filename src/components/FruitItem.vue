<template>
  <ion-item class="fruit-item" lines="none">
    <img
      v-if="fruit.imageBase64 || fruit.imageUrl"
      class="fruit-photo"
      slot="start"
      :src="fruit.imageBase64 || fruit.imageUrl"
      :alt="fruit.name"
    />
    <div v-else class="fruit-icon" slot="start">{{ fruit.inStock ? '🍍' : '🍈' }}</div>
    <ion-label>
      <h2>{{ fruit.name }}</h2>
      <p>{{ fruit.category }} · {{ fruit.inStock ? 'In stock' : 'Currently unavailable' }}</p>
      <p v-if="fruit.description">{{ fruit.description }}</p>
      <p v-if="fruit.minBulkQty > 0">Bulk orders from {{ fruit.minBulkQty }} {{ fruit.unit }}</p>
    </ion-label>
    <div class="price">
      ₱{{ fruit.price.toFixed(2) }}<small>/ {{ fruit.unit }}</small>
    </div>
    <div v-if="editable" slot="end" class="actions">
      <ion-toggle
        :checked="fruit.inStock"
        :aria-label="`${fruit.inStock ? 'Mark' : 'Set'} ${fruit.name} ${fruit.inStock ? 'unavailable' : 'available'}`"
        @ion-change="$emit('toggle', fruit, Boolean($event.detail.checked))"
      />
      <ion-button fill="clear" size="small" :aria-label="`Edit ${fruit.name}`" @click="$emit('edit', fruit)">
        <ion-icon slot="icon-only" :icon="createOutline" />
      </ion-button>
      <ion-button
        fill="clear"
        size="small"
        :aria-label="`Delete ${fruit.name}`"
        color="danger"
        @click="$emit('delete', fruit)"
      >
        <ion-icon slot="icon-only" :icon="trashOutline" />
      </ion-button>
    </div>
  </ion-item>
</template>

<script setup lang="ts">
import { IonButton, IonIcon, IonItem, IonLabel, IonToggle } from '@ionic/vue';
import { createOutline, trashOutline } from 'ionicons/icons';

import type { FruitListing } from '@/types';

defineProps<{ fruit: FruitListing; editable?: boolean }>();
defineEmits<{
  edit: [fruit: FruitListing];
  delete: [fruit: FruitListing];
  toggle: [fruit: FruitListing, inStock: boolean];
}>();
</script>

<style scoped>
.fruit-item {
  --padding-start: 0;
  --inner-padding-end: 0;
  --background: transparent;
  margin: 4px 0;
}

.fruit-icon {
  display: grid;
  width: 48px;
  height: 48px;
  margin-right: 12px;
  place-items: center;
  border-radius: 14px;
  background: #fff3dc;
  font-size: 26px;
}

.fruit-photo {
  width: 48px;
  height: 48px;
  margin-right: 12px;
  border-radius: 14px;
  object-fit: cover;
}

ion-label h2 {
  font-weight: 700;
}

ion-label p {
  margin-top: 4px;
}

.price {
  align-self: flex-start;
  margin: 10px 0 0 8px;
  color: var(--ion-color-primary-shade);
  font-weight: 700;
  white-space: nowrap;
}

.price small {
  display: block;
  color: var(--ion-color-medium);
  font-size: 0.72rem;
  font-weight: 400;
  text-align: right;
}

.actions {
  display: flex;
  align-items: center;
  margin-left: 4px;
}
</style>
