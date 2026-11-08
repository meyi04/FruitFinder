<template>
  <div class="empty-state">
    <div class="empty-icon"><ion-icon :icon="icon" /></div>
    <h2>{{ title }}</h2>
    <p>{{ message }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { leafOutline } from 'ionicons/icons';

withDefaults(defineProps<{ title: string; message: string; icon?: string }>(), { icon: leafOutline });
</script>

<style scoped>
.empty-state {
  padding: 46px 24px;
  text-align: center;
  color: var(--ion-color-medium);
}

.empty-icon {
  display: grid;
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  place-items: center;
  border-radius: 50%;
  background: #eaf5e9;
  color: var(--ion-color-primary);
  font-size: 30px;
}

h2 {
  margin: 0 0 8px;
  color: var(--ion-text-color);
  font-size: 1.15rem;
}

p {
  margin: 0;
  line-height: 1.5;
}
</style>
