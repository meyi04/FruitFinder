import { onAuthStateChanged } from 'firebase/auth';
import { defineStore } from 'pinia';
import { ref } from 'vue';

import { auth } from '@/firebase/config';
import * as authService from '@/services/authService';
import type { RegisterInput } from '@/services/authService';
import type { UserProfile } from '@/types';

export const useAuthStore = defineStore('auth', () => {
  const profile = ref<UserProfile | null>(null);
  const initialized = ref(false);
  const initializationError = ref('');
  let initialization: Promise<void> | null = null;

  function initialize(): Promise<void> {
    if (initialized.value) return Promise.resolve();
    if (initialization) return initialization;

    initialization = new Promise((resolve) => {
      onAuthStateChanged(
        auth,
        async (user) => {
          try {
            const restoredProfile = user ? await authService.getUserProfile(user.uid) : null;
            if (restoredProfile?.status === 'suspended') {
              await authService.logout();
              profile.value = null;
            } else {
              profile.value = restoredProfile;
            }
          } catch (error) {
            console.error('Unable to load the signed-in user profile.', error);
            initializationError.value = error instanceof Error ? error.message : 'Unable to load your account profile.';
            profile.value = null;
          } finally {
            initialized.value = true;
            resolve();
          }
        },
        (error) => {
          console.error('Unable to restore the authentication session.', error);
          initializationError.value = error.message;
          initialized.value = true;
          resolve();
        },
      );
    });
    return initialization;
  }

  async function login(email: string, password: string): Promise<void> {
    profile.value = await authService.login(email, password);
    initializationError.value = '';
  }

  async function register(input: RegisterInput): Promise<void> {
    profile.value = await authService.register(input);
    initializationError.value = '';
  }

  async function logout(): Promise<void> {
    await authService.logout();
    profile.value = null;
  }

  async function refreshProfile(): Promise<void> {
    if (!profile.value) return;
    const updated = await authService.getUserProfile(profile.value.uid);
    if (!updated) throw new Error('Your account profile could not be found.');
    profile.value = updated;
  }

  return { profile, initialized, initializationError, initialize, login, register, logout, refreshProfile };
});
