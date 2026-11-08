<template>
  <div class="chips" role="group" aria-label="Filter by fruit category">
    <ion-chip :outline="modelValue !== ''" @click="$emit('update:modelValue', '')">
      <ion-label>All fruits</ion-label>
    </ion-chip>
    <ion-chip
      v-for="category in categories"
      :key="category"
      :outline="modelValue !== category"
      @click="$emit('update:modelValue', category)"
    >
      <ion-label>{{ category }}</ion-label>
    </ion-chip>
  </div>
</template>

<script setup lang="ts">
import { IonChip, IonLabel } from '@ionic/vue';

import { FRUIT_CATEGORIES } from '@/types';

defineProps<{ modelValue: string }>();
defineEmits<{ 'update:modelValue': [value: string] }>();
const categories = FRUIT_CATEGORIES;
</script>

<style scoped>
.chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 2px 0 10px;
  scrollbar-width: none;
}

.chips::-webkit-scrollbar {
  display: none;
}

ion-chip {
  flex: 0 0 auto;
  margin: 0;
  --background: #eaf5e9;
  --color: #35783a;
}
</style>
