<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button v-if="profile?.role === 'admin'" tab="admin" href="/tabs/admin">
          <ion-icon aria-hidden="true" :icon="shieldCheckmarkOutline" />
          <ion-label>Admin</ion-label>
        </ion-tab-button>
        <template v-else>
          <ion-tab-button tab="home" href="/tabs/home">
            <ion-icon aria-hidden="true" :icon="homeOutline" />
            <ion-label>Home</ion-label>
          </ion-tab-button>
          <ion-tab-button tab="suppliers" href="/tabs/suppliers">
            <ion-icon aria-hidden="true" :icon="storefrontOutline" />
            <ion-label>Suppliers</ion-label>
          </ion-tab-button>
          <ion-tab-button v-if="profile?.role === 'buyer'" tab="favorites" href="/tabs/favorites">
            <ion-icon aria-hidden="true" :icon="heartOutline" />
            <ion-label>Saved</ion-label>
          </ion-tab-button>
          <ion-tab-button tab="activity" href="/tabs/activity">
            <ion-icon aria-hidden="true" :icon="receiptOutline" />
            <ion-label>Activity</ion-label>
          </ion-tab-button>
          <ion-tab-button v-if="profile?.role === 'supplier'" tab="dashboard" href="/tabs/dashboard">
            <ion-icon aria-hidden="true" :icon="analyticsOutline" />
            <ion-label>Dashboard</ion-label>
          </ion-tab-button>
        </template>
        <ion-tab-button tab="profile" href="/tabs/profile">
          <ion-icon aria-hidden="true" :icon="personOutline" />
          <ion-label>Profile</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { IonIcon, IonLabel, IonPage, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/vue';
import {
  analyticsOutline,
  heartOutline,
  homeOutline,
  personOutline,
  receiptOutline,
  storefrontOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';

import { useAuthStore } from '@/stores/authStore';

const { profile } = storeToRefs(useAuthStore());
</script>
