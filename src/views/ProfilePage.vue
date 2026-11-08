<template>
  <ion-page>
    <ion-header
      ><ion-toolbar><ion-title>Your profile</ion-title></ion-toolbar></ion-header
    >
    <ion-content>
      <div v-if="profile" class="content">
        <section class="profile-hero">
          <div class="avatar">{{ profile.name.slice(0, 1).toUpperCase() }}</div>
          <h1>{{ profile.name }}</h1>
          <p>{{ profile.email }}</p>
          <ion-chip color="primary"
            ><ion-label>{{
              profile.role === 'supplier'
                ? 'Supplier account'
                : profile.role === 'admin'
                  ? 'Admin account'
                  : 'Buyer account'
            }}</ion-label></ion-chip
          >
        </section>

        <form class="profile-form" @submit.prevent="save">
          <h2>Personal details</h2>
          <ion-input
            v-model="name"
            label="Full name"
            label-placement="stacked"
            autocomplete="name"
            required
            fill="outline"
          />
          <ion-input
            v-model="phone"
            label="Phone number"
            label-placement="stacked"
            type="tel"
            autocomplete="tel"
            fill="outline"
          />
          <ion-input
            v-model="municipality"
            label="Municipality"
            label-placement="stacked"
            autocomplete="address-level2"
            fill="outline"
          />
          <ion-input
            v-model="barangay"
            label="Barangay"
            label-placement="stacked"
            autocomplete="address-level3"
            fill="outline"
          />
          <ion-button expand="block" type="submit" :disabled="saving">{{
            saving ? 'Saving…' : 'Save changes'
          }}</ion-button>
        </form>

        <ion-button
          v-if="profile.role === 'supplier'"
          class="dashboard-link"
          expand="block"
          fill="outline"
          router-link="/tabs/dashboard"
        >
          <ion-icon slot="start" :icon="storefrontOutline" /> Open supplier dashboard
        </ion-button>
        <ion-button
          class="logout"
          expand="block"
          fill="clear"
          color="danger"
          :disabled="loggingOut"
          @click="confirmSignOut"
        >
          {{ loggingOut ? 'Signing out…' : 'Sign out' }}
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonButton,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonLabel,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { alertController } from '@ionic/vue';
import { storefrontOutline } from 'ionicons/icons';

import { errorMessage, showToast } from '@/composables/useAppToast';
import { updateUserProfile } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore();
const router = useRouter();
const saving = ref(false);
const loggingOut = ref(false);
const name = ref('');
const phone = ref('');
const municipality = ref('');
const barangay = ref('');
const profile = computed(() => authStore.profile);

function populate(): void {
  const current = authStore.profile;
  if (!current) return;
  name.value = current.name;
  phone.value = current.phone || '';
  municipality.value = current.municipality || '';
  barangay.value = current.barangay || '';
}

watch(() => authStore.profile, populate);
onMounted(populate);

async function save(): Promise<void> {
  if (!authStore.profile) return;
  if (name.value.trim().length < 2) {
    await showToast('Please enter a name with at least 2 characters.');
    return;
  }
  saving.value = true;
  try {
    await updateUserProfile(authStore.profile.uid, {
      name: name.value.trim(),
      phone: phone.value.trim(),
      municipality: municipality.value.trim(),
      barangay: barangay.value.trim(),
    });
    await authStore.refreshProfile();
    await showToast('Profile updated.', 'success');
  } catch (error) {
    await showToast(errorMessage(error, 'Unable to update your profile.'));
  } finally {
    saving.value = false;
  }
}

async function signOut(): Promise<void> {
  loggingOut.value = true;
  try {
    await authStore.logout();
    await router.replace('/login');
  } catch (error) {
    await showToast(errorMessage(error, 'Unable to sign out.'));
  } finally {
    loggingOut.value = false;
  }
}

async function confirmSignOut(): Promise<void> {
  const alert = await alertController.create({
    header: 'Sign out?',
    message: 'Are you sure you want to sign out of FruitFinder?',
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      { text: 'Sign out', role: 'confirm', handler: () => void signOut() },
    ],
  });
  await alert.present();
}
</script>

<style scoped>
.content {
  width: min(100% - 36px, 520px);
  margin: 0 auto;
  padding-bottom: 24px;
}

.profile-hero {
  padding: 28px 0 22px;
  text-align: center;
}

.avatar {
  display: grid;
  width: 76px;
  height: 76px;
  margin: 0 auto 12px;
  place-items: center;
  border-radius: 50%;
  background: #e7f4e3;
  color: var(--ion-color-primary-shade);
  font-size: 2rem;
  font-weight: 800;
}

h1 {
  margin: 0 0 5px;
  font-size: 1.45rem;
}

.profile-hero p {
  margin: 0;
  color: var(--ion-color-medium);
}

.profile-form {
  display: grid;
  gap: 14px;
  padding: 20px;
  border-radius: 18px;
  background: white;
  box-shadow: 0 4px 18px rgb(38 51 40 / 5%);
}

h2 {
  margin: 0;
  font-size: 1.1rem;
}

ion-input {
  --background: #fbfcfa;
  --border-radius: 12px;
  --padding-start: 12px;
}

.profile-form ion-button {
  margin-top: 6px;
}

.dashboard-link {
  margin-top: 18px;
}

.logout {
  margin-top: 8px;
}

@media (min-width: 760px) {
  .content {
    width: min(100% - 48px, 640px);
  }

  .profile-form {
    padding: 24px;
  }
}
</style>
