<template>
  <ion-page>
    <ion-content>
      <div class="loading">
        <img src="/fruitfinder-logo.svg" alt="" />
        <ion-spinner name="crescent" />
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { IonContent, IonPage, IonSpinner } from '@ionic/vue';

import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore();
const router = useRouter();

onMounted(async () => {
  await authStore.initialize();
  const destination =
    authStore.profile?.role === 'admin'
      ? '/tabs/admin'
      : authStore.profile?.role === 'supplier'
        ? '/tabs/dashboard'
        : '/tabs/home';
  await router.replace(destination);
});
</script>

<style scoped>
.loading {
  display: grid;
  min-height: 100%;
  align-content: center;
  justify-items: center;
  gap: 16px;
  color: var(--ion-color-primary);
}

img {
  width: 58px;
  height: 58px;
  border-radius: 18px;
}
</style>
