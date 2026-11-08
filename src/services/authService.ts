import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';

import { auth, db } from '@/firebase/config';
import type { UserProfile, UserRole } from '@/types';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export async function register(input: RegisterInput): Promise<UserProfile> {
  const credential = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
  const batch = writeBatch(db);
  const profile: Omit<UserProfile, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> } = {
    uid: credential.user.uid,
    name: input.name.trim(),
    email: input.email.trim(),
    role: input.role,
    phone: '',
    municipality: '',
    barangay: '',
    createdAt: serverTimestamp(),
  };
  batch.set(doc(db, 'users', credential.user.uid), profile);

  if (input.role === 'supplier') {
    batch.set(doc(db, 'suppliers', credential.user.uid), {
      businessName: input.name.trim(),
      description: '',
      address: '',
      municipality: '',
      barangay: '',
      phone: '',
      facebookLink: '',
      orderTypes: ['retail'],
      categories: [],
      avgRating: 0,
      reviewCount: 0,
      isActive: true,
      createdAt: serverTimestamp(),
    });
  }

  try {
    await updateProfile(credential.user, { displayName: input.name.trim() });
    await batch.commit();
  } catch (error) {
    try {
      await credential.user.delete();
    } catch (cleanupError) {
      console.error('Unable to remove the newly created account after registration failed.', cleanupError);
    }
    throw error;
  }

  const createdProfile = await getUserProfile(credential.user.uid);
  if (!createdProfile) throw new Error('Your account was created, but its profile could not be loaded.');
  return createdProfile;
}

export async function login(email: string, password: string): Promise<UserProfile> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  const profile = await getUserProfile(credential.user.uid);
  if (!profile || profile.status === 'suspended') {
    await signOut(auth);
    throw new Error(
      profile?.status === 'suspended'
        ? 'This account has been suspended. Please contact the administrator.'
        : 'Your account profile is missing. Please contact support.',
    );
  }
  return profile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, 'users', uid));
  return snapshot.exists() ? ({ uid, ...snapshot.data() } as UserProfile) : null;
}

export async function updateUserProfile(
  uid: string,
  changes: Pick<UserProfile, 'name' | 'phone' | 'municipality' | 'barangay'>,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), changes);
  if (auth.currentUser?.uid === uid && auth.currentUser.displayName !== changes.name) {
    await updateProfile(auth.currentUser, { displayName: changes.name });
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function logout(): Promise<void> {
  await signOut(auth);
}
