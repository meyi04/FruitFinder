<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button default-href="/tabs/activity" /></ion-buttons>
        <ion-title>{{ otherName || 'Messages' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content ref="contentRef" class="chat-content">
      <div v-if="loading" class="loading"><ion-spinner name="crescent" /></div>
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <ion-button router-link="/tabs/activity">Back to activity</ion-button>
      </div>
      <div v-else class="chat">
        <div class="chat-intro">
          <div class="chat-avatar">{{ otherName.slice(0, 1).toUpperCase() }}</div>
          <strong>{{ otherName }}</strong>
          <p>Discuss your order, pickup, delivery, and payment here.</p>
        </div>
        <div v-if="!messages.length" class="first-message">
          <p>Say hello to start the conversation.</p>
        </div>
        <div class="messages">
          <article
            v-for="message in messages"
            :key="message.id"
            class="message"
            :class="{ mine: message.senderId === profile?.uid }"
          >
            <span v-if="message.senderId !== profile?.uid" class="sender">{{ message.senderName }}</span>
            <p>{{ message.text }}</p>
            <time>{{ formatTime(message.createdAt) }}</time>
          </article>
        </div>
      </div>
    </ion-content>
    <ion-footer v-if="conversation && !loading && !error">
      <form class="composer" @submit.prevent="submitMessage">
        <ion-textarea
          v-model="draft"
          aria-label="Message"
          placeholder="Write a message…"
          :maxlength="2000"
          :auto-grow="true"
          :rows="1"
          enterkeyhint="send"
          @keydown.enter.exact.prevent="submitMessage"
        />
        <ion-button type="submit" :disabled="sending || !draft.trim()" aria-label="Send message">
          <ion-icon slot="icon-only" :icon="sendOutline" />
        </ion-button>
      </form>
      <p class="transaction-note">
        Keep order and payment details in this chat. Arrange payment directly with the supplier.
      </p>
    </ion-footer>
  </ion-page>
</template>

<script setup lang="ts">
import { onIonViewWillEnter, onIonViewWillLeave } from '@ionic/vue';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { sendOutline } from 'ionicons/icons';

import { errorMessage, showToast } from '@/composables/useAppToast';
import { getConversation, sendMessage, subscribeToMessages } from '@/services/messageService';
import { useAuthStore } from '@/stores/authStore';
import type { ChatMessage, Conversation } from '@/types';

const route = useRoute();
const authStore = useAuthStore();
const profile = computed(() => authStore.profile);
const conversationId = computed(() => String(route.params.conversationId));
const conversation = ref<Conversation | null>(null);
const messages = ref<ChatMessage[]>([]);
const draft = ref('');
const loading = ref(true);
const sending = ref(false);
const error = ref('');
const contentRef = ref<InstanceType<typeof IonContent> | null>(null);
let unsubscribe: (() => void) | undefined;

const otherName = computed(() => {
  if (!conversation.value || !profile.value) return '';
  return profile.value.uid === conversation.value.supplierId
    ? conversation.value.buyerName
    : conversation.value.supplierName;
});

function stopMessages(): void {
  unsubscribe?.();
  unsubscribe = undefined;
}

async function loadConversation(): Promise<void> {
  stopMessages();
  conversation.value = null;
  messages.value = [];
  loading.value = true;
  error.value = '';
  const user = profile.value;
  if (!user) {
    error.value = 'Sign in to view messages.';
    loading.value = false;
    return;
  }

  try {
    const result = await getConversation(conversationId.value);
    if (!result || !result.participantIds.includes(user.uid)) {
      throw new Error('You do not have access to this conversation.');
    }
    conversation.value = result;
    unsubscribe = subscribeToMessages(
      conversationId.value,
      (items) => {
        messages.value = items;
        void nextTick(() => contentRef.value?.$el?.scrollToBottom(200));
      },
      (cause) => {
        error.value = errorMessage(cause, 'Unable to receive messages.');
      },
    );
  } catch (cause) {
    error.value = errorMessage(cause, 'Unable to open this conversation.');
  } finally {
    loading.value = false;
  }
}

function formatTime(timestamp?: { toDate: () => Date }): string {
  if (!timestamp) return 'Sending…';
  return timestamp.toDate().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

async function submitMessage(): Promise<void> {
  const user = profile.value;
  if (!user || !conversation.value || !draft.value.trim()) return;
  const text = draft.value;
  sending.value = true;
  try {
    await sendMessage(conversation.value, user, text);
    draft.value = '';
  } catch (cause) {
    await showToast(errorMessage(cause, 'Unable to send your message.'));
  } finally {
    sending.value = false;
  }
}

watch(conversationId, loadConversation);
onIonViewWillEnter(loadConversation);
onIonViewWillLeave(stopMessages);
onUnmounted(stopMessages);
</script>

<style scoped>
.chat-content {
  --background: #f5f8f3;
}

.loading {
  display: grid;
  min-height: 55vh;
  place-items: center;
  color: var(--ion-color-primary);
}

.error-state {
  padding: 30px 20px;
  color: var(--ion-color-danger);
  text-align: center;
}

.chat {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  padding: 16px 16px 22px;
}

.chat-intro {
  display: grid;
  justify-items: center;
  margin: 4px auto 18px;
  text-align: center;
}

.chat-avatar {
  display: grid;
  width: 56px;
  height: 56px;
  margin-bottom: 10px;
  place-items: center;
  border-radius: 50%;
  background: #e4f2df;
  color: var(--ion-color-primary-shade);
  font-size: 1.4rem;
  font-weight: 700;
}

.chat-intro p,
.first-message {
  color: var(--ion-color-medium);
  font-size: 0.84rem;
}

.chat-intro p {
  margin: 5px 0 0;
}

.first-message {
  margin: 18px 0;
  text-align: center;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: auto;
}

.message {
  max-width: min(84%, 430px);
  align-self: flex-start;
  padding: 10px 12px 7px;
  border-radius: 16px 16px 16px 4px;
  background: white;
  box-shadow: 0 2px 8px rgb(38 51 40 / 5%);
}

.message.mine {
  align-self: flex-end;
  border-radius: 16px 16px 4px 16px;
  background: #e1f1dc;
}

.message .sender {
  color: var(--ion-color-primary-shade);
  font-size: 0.72rem;
  font-weight: 700;
}

.message p {
  margin: 2px 0 6px;
  line-height: 1.4;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.message time {
  display: block;
  color: var(--ion-color-medium);
  font-size: 0.68rem;
  text-align: right;
}

.composer {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px 14px 0;
  background: white;
}

.composer ion-textarea {
  max-height: 120px;
  border: 1px solid var(--ion-border-color);
  border-radius: 20px;
  padding: 4px 12px;
  background: #f8faf7;
  --padding-start: 0;
  --padding-end: 0;
}

.composer ion-button {
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  margin: 0 0 2px;
}

.transaction-note {
  margin: 0;
  padding: 4px 14px 10px;
  background: white;
  color: var(--ion-color-medium);
  font-size: 0.7rem;
  text-align: center;
}
</style>
