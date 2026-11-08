import { toastController } from '@ionic/vue';

export async function showToast(message: string, color: 'success' | 'danger' | 'warning' = 'danger'): Promise<void> {
  const toast = await toastController.create({
    message,
    color,
    duration: 2800,
    position: 'bottom',
  });
  await toast.present();
}

export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!(error instanceof Error)) return fallback;
  const message = error.message;
  const normalizedMessage = message.toLowerCase();
  if (
    normalizedMessage.includes('requires an index') ||
    (normalizedMessage.includes('index') && normalizedMessage.includes('building'))
  ) {
    return 'This report needs a Firestore index that is still building. Wait a few minutes, then retry. If it remains unavailable, deploy the project Firestore indexes.';
  }
  if (message.includes('auth/invalid-credential')) return 'Incorrect email or password.';
  if (message.includes('auth/email-already-in-use')) return 'An account already exists for this email.';
  if (message.includes('auth/weak-password')) return 'Use a stronger password with at least 6 characters.';
  if (message.includes('auth/invalid-email')) return 'Enter a valid email address.';
  if (message.includes('auth/too-many-requests')) return 'Too many attempts. Please wait and try again.';
  if (message.includes('permission-denied')) return 'You do not have permission to do that.';
  return message || fallback;
}
