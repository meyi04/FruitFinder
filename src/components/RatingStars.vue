<template>
  <span class="rating" :aria-label="`${rating.toFixed(1)} out of 5 stars`">
    <ion-icon v-for="star in 5" :key="star" :icon="star <= Math.round(rating) ? starIcon : starOutline" />
    <span v-if="showValue" class="rating-value">{{ rating.toFixed(1) }}</span>
  </span>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { star, starOutline } from 'ionicons/icons';

withDefaults(defineProps<{ rating: number; showValue?: boolean }>(), { showValue: true });

const starIcon = star;
</script>

<style scoped>
.rating {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: #f59e0b;
}

.rating-value {
  margin-left: 5px;
  color: var(--ion-text-color);
  font-size: 0.85rem;
  font-weight: 600;
}
</style>
