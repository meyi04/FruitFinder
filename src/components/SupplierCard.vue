<template>
  <ion-card class="supplier-card">
    <router-link :to="`/suppliers/${supplier.id}`" class="card-link">
      <div class="cover">
        <div class="fruit-mark">🍊</div>
        <span class="local-pill"><ion-icon :icon="locationOutline" /> {{ location }}</span>
      </div>
      <ion-card-content>
        <div class="title-row">
          <h2>{{ supplier.businessName }}</h2>
          <ion-badge color="success">Local</ion-badge>
        </div>
        <p class="description">{{ supplier.description || 'Fresh local fruit, ready for your table.' }}</p>
        <div class="meta">
          <RatingStars :rating="supplier.avgRating || 0" />
          <span>{{ supplier.reviewCount || 0 }} reviews</span>
        </div>
        <div class="tags">
          <ion-chip v-for="category in supplier.categories?.slice(0, 3)" :key="category">
            <ion-label>{{ category }}</ion-label>
          </ion-chip>
          <ion-chip v-for="type in supplier.orderTypes?.slice(0, 2)" :key="type" color="secondary">
            <ion-label>{{ type }}</ion-label>
          </ion-chip>
        </div>
      </ion-card-content>
    </router-link>
    <ion-button
      v-if="favorite !== undefined"
      class="favorite-button"
      fill="clear"
      :aria-label="favorite ? 'Remove from favorites' : 'Add to favorites'"
      @click.prevent.stop="$emit('favorite')"
    >
      <ion-icon slot="icon-only" :icon="favorite ? heart : heartOutline" />
    </ion-button>
  </ion-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonBadge, IonButton, IonCard, IonCardContent, IonChip, IonIcon, IonLabel } from '@ionic/vue';
import { heart, heartOutline, locationOutline } from 'ionicons/icons';

import RatingStars from '@/components/RatingStars.vue';
import type { Supplier } from '@/types';

const props = defineProps<{ supplier: Supplier; favorite?: boolean }>();
defineEmits<{ favorite: [] }>();
const location = computed(
  () => [props.supplier.barangay, props.supplier.municipality].filter(Boolean).join(', ') || 'Local supplier',
);
</script>

<style scoped>
.supplier-card {
  position: relative;
  overflow: hidden;
  margin: 0;
}

.card-link {
  color: inherit;
  text-decoration: none;
}

.cover {
  position: relative;
  display: grid;
  min-height: 120px;
  place-items: center;
  background: linear-gradient(135deg, #e6f4df, #fff2d6);
}

.fruit-mark {
  font-size: 54px;
}

.local-pill {
  position: absolute;
  right: 12px;
  bottom: 10px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 20px;
  padding: 5px 9px;
  background: rgb(255 255 255 / 90%);
  font-size: 0.74rem;
}

.favorite-button {
  position: absolute;
  z-index: 1;
  top: 8px;
  right: 8px;
  width: 40px;
  height: 40px;
  margin: 0;
  border-radius: 50%;
  background: white;
  --color: #e85d57;
}

ion-card-content {
  padding: 14px 16px 16px;
}

.title-row,
.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

h2 {
  margin: 0;
  font-size: 1.05rem;
}

.description {
  margin: 8px 0;
  color: var(--ion-color-medium);
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.meta {
  justify-content: flex-start;
  color: var(--ion-color-medium);
  font-size: 0.8rem;
}

.tags {
  display: flex;
  gap: 5px;
  overflow: hidden;
  margin-top: 8px;
}

.tags ion-chip {
  height: 25px;
  margin: 0;
  font-size: 0.72rem;
  text-transform: capitalize;
}
</style>
