<template>
  <ion-page>
    <ion-content class="auth-content">
      <main class="auth-wrap">
        <router-link class="back-link" to="/login">← Back to sign in</router-link>
        <img class="brand-mark" src="/fruitfinder-logo.svg" alt="FruitFinder" />
        <p class="eyebrow">ACCOUNT RECOVERY</p>
        <h1>Forgot<br /><span>your password?</span></h1>
        <p class="subheading">Enter your email and we’ll send you a link to reset your password.</p>
        <form class="auth-form" @submit.prevent="submit">
          <ion-input
            v-model="email"
            label="Email address"
            label-placement="stacked"
            type="email"
            autocomplete="email"
            required
            fill="outline"
          />
          <ion-button expand="block" type="submit" :disabled="loading">
            {{ loading ? 'Sending…' : 'Send reset link' }}
          </ion-button>
        </form>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonButton, IonContent, IonInput, IonPage } from '@ionic/vue';

import { errorMessage, showToast } from '@/composables/useAppToast';
import { sendPasswordReset } from '@/services/authService';

const email = ref('');
const loading = ref(false);

async function submit(): Promise<void> {
  loading.value = true;
  try {
    await sendPasswordReset(email.value);
    await showToast('If an account exists for that email, a reset link is on its way.', 'success');
  } catch (error) {
    await showToast(errorMessage(error, 'Unable to send a password reset email.'));
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
  padding: max(8vh, 34px) 0;
}

.back-link {
  color: var(--ion-color-primary-shade);
  font-weight: 600;
  text-decoration: none;
}

.brand-mark {
  width: 58px;
  height: 58px;
  margin-top: 36px;
  border-radius: 20px;
  object-fit: cover;
}

.eyebrow {
  margin: 26px 0 10px;
  color: #438d48;
  font-size: 0.73rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}

h1 {
  margin: 0;
  font-size: clamp(2.4rem, 10vw, 3.3rem);
  line-height: 1.08;
}

h1 span {
  color: var(--ion-color-primary);
}

.subheading {
  margin: 14px 0 24px;
  color: var(--ion-color-medium);
  line-height: 1.55;
}

.auth-form {
  display: grid;
  gap: 16px;
}

ion-input {
  --background: white;
  --border-radius: 13px;
  --padding-start: 14px;
}

ion-button {
  height: 50px;
  font-weight: 700;
}
</style>
