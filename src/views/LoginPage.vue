<template>
  <ion-page>
    <ion-content class="auth-content">
      <main class="auth-wrap">
        <img class="brand-mark" src="/fruitfinder-logo.svg" alt="FruitFinder" />
        <p class="eyebrow">WELCOME TO FRUITFINDER</p>
        <h1>Fresh finds,<br /><span>right nearby.</span></h1>
        <p class="subheading">Sign in to discover the best fruit in your community.</p>

        <form class="auth-form" @submit.prevent="submit">
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
          <div class="password-field">
            <ion-input
              v-model="password"
              label="Password"
              label-placement="stacked"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              required
              fill="outline"
            />
            <ion-button
              class="password-toggle"
              fill="clear"
              type="button"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
            >
              <ion-icon slot="icon-only" :icon="showPassword ? eyeOffOutline : eyeOutline" />
            </ion-button>
          </div>
          <router-link class="forgot-link" to="/forgot-password">Forgot password?</router-link>
          <ion-button expand="block" type="submit" :disabled="loading">
            {{ loading ? 'Signing in…' : 'Sign in' }}
          </ion-button>
        </form>

        <p class="auth-foot">New to FruitFinder? <router-link to="/register">Create an account</router-link></p>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonButton, IonContent, IonIcon, IonInput, IonPage } from '@ionic/vue';
import { eyeOffOutline, eyeOutline } from 'ionicons/icons';

import { errorMessage, showToast } from '@/composables/useAppToast';
import { useAuthStore } from '@/stores/authStore';

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

onMounted(() => {
  if (authStore.initializationError) {
    void showToast(`Could not restore your session: ${authStore.initializationError}`);
  }
});

async function submit(): Promise<void> {
  loading.value = true;
  try {
    await authStore.login(email.value, password.value);
    const requestedPath = typeof route.query.redirect === 'string' ? route.query.redirect : '';
    const defaultPath =
      authStore.profile?.role === 'admin'
        ? '/tabs/admin'
        : authStore.profile?.role === 'supplier'
          ? '/tabs/dashboard'
          : '/tabs/home';
    const redirectPath = requestedPath.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : defaultPath;
    await router.replace(redirectPath);
  } catch (error) {
    await showToast(errorMessage(error, 'Unable to sign in.'));
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
  padding: max(9vh, 46px) 0 34px;
}

.brand-mark {
  width: 58px;
  height: 58px;
  border-radius: 20px;
  object-fit: cover;
  box-shadow: 0 8px 26px rgb(52 112 56 / 12%);
}

.password-field {
  position: relative;
}

.password-field ion-input {
  --padding-end: 48px;
}

.password-toggle {
  position: absolute;
  z-index: 2;
  right: 3px;
  bottom: 1px;
  height: 44px;
  --color: var(--ion-color-medium);
}

.eyebrow {
  margin: 32px 0 10px;
  color: #438d48;
  font-size: 0.73rem;
  font-weight: 800;
  letter-spacing: 0.12em;
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

.subheading {
  margin: 14px 0 28px;
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
  --highlight-color-focused: var(--ion-color-primary);
}

.forgot-link {
  justify-self: end;
  margin-top: -6px;
  color: var(--ion-color-primary-shade);
  font-size: 0.9rem;
  text-decoration: none;
}

ion-button {
  height: 50px;
  margin-top: 4px;
  font-weight: 700;
}

.auth-foot {
  margin-top: 26px;
  color: var(--ion-color-medium);
  text-align: center;
}

.auth-foot a {
  color: var(--ion-color-primary-shade);
  font-weight: 700;
  text-decoration: none;
}
</style>
