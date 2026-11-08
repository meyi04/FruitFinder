<template>
  <ion-page>
    <ion-content class="auth-content">
      <main class="auth-wrap">
        <router-link class="back-link" to="/login">← Back to sign in</router-link>
        <p class="eyebrow">JOIN YOUR LOCAL FRUIT COMMUNITY</p>
        <h1>Create<br /><span>your account.</span></h1>
        <p class="subheading">Find your next favorite fruit — or share your harvest.</p>

        <form class="auth-form" @submit.prevent="submit">
          <ion-input
            v-model="name"
            label="Full name"
            label-placement="stacked"
            autocomplete="name"
            required
            fill="outline"
          />
          <ion-input
            v-model="email"
            label="Email address"
            label-placement="stacked"
            type="email"
            autocomplete="email"
            inputmode="email"
            required
            fill="outline"
          />
          <ion-input
            v-model="password"
            label="Password"
            label-placement="stacked"
            type="password"
            autocomplete="new-password"
            :minlength="6"
            required
            fill="outline"
          />
          <ion-select v-model="role" label="I want to…" label-placement="stacked" fill="outline" interface="popover">
            <ion-select-option value="buyer">Shop from local sellers</ion-select-option>
            <ion-select-option value="supplier">Sell my fruit</ion-select-option>
          </ion-select>
          <ion-button expand="block" type="submit" :disabled="loading">
            {{ loading ? 'Creating account…' : 'Create account' }}
          </ion-button>
        </form>

        <p class="auth-foot">Already have an account? <router-link to="/login">Sign in</router-link></p>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonButton, IonContent, IonInput, IonPage, IonSelect, IonSelectOption } from '@ionic/vue';

import { errorMessage, showToast } from '@/composables/useAppToast';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types';

const name = ref('');
const email = ref('');
const password = ref('');
const role = ref<UserRole>('buyer');
const loading = ref(false);
const authStore = useAuthStore();
const router = useRouter();

async function submit(): Promise<void> {
  if (name.value.trim().length < 2) {
    await showToast('Please enter your name.');
    return;
  }
  loading.value = true;
  try {
    await authStore.register({
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value,
      role: role.value,
    });
    await showToast('Welcome to FruitFinder!', 'success');
    await router.replace(role.value === 'supplier' ? '/tabs/dashboard' : '/tabs/home');
  } catch (error) {
    await showToast(errorMessage(error, 'Unable to create your account.'));
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-content {
  --background: linear-gradient(160deg, #f3faef 0%, #fff9ec 100%);
}

.auth-wrap {
  width: min(100% - 40px, 430px);
  margin: 0 auto;
  padding: max(6vh, 28px) 0 32px;
}

.back-link {
  color: var(--ion-color-primary-shade);
  font-weight: 600;
  text-decoration: none;
}

.eyebrow {
  margin: 30px 0 10px;
  color: #438d48;
  font-size: 0.73rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}

h1 {
  margin: 0;
  font-size: clamp(2.5rem, 11vw, 3.5rem);
  line-height: 1.06;
  letter-spacing: -0.05em;
}

h1 span {
  color: var(--ion-color-primary);
}

.subheading,
.auth-foot {
  color: var(--ion-color-medium);
}

.auth-form {
  display: grid;
  gap: 14px;
  margin-top: 24px;
}

ion-input,
ion-select {
  --background: white;
  --border-radius: 13px;
  --padding-start: 14px;
}

ion-button {
  height: 50px;
  margin-top: 8px;
  font-weight: 700;
}

.auth-foot {
  margin-top: 24px;
  text-align: center;
}

.auth-foot a {
  color: var(--ion-color-primary-shade);
  font-weight: 700;
  text-decoration: none;
}
</style>
