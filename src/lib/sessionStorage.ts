import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { AuthSession } from '../types/auth';

const SESSION_KEY = 'munolink.backend.session';

export async function getStoredSession(): Promise<AuthSession | null> {
  const stored =
    Platform.OS === 'web'
      ? window.localStorage.getItem(SESSION_KEY)
      : await SecureStore.getItemAsync(SESSION_KEY);

  if (!stored) return null;

  let session: AuthSession;
  try {
    session = JSON.parse(stored) as AuthSession;
  } catch {
    await clearStoredSession();
    throw new Error('Stored sign-in session could not be read.');
  }
  if (!session.access_token || !session.refresh_token || !session.user?.id) {
    await clearStoredSession();
    throw new Error('Stored sign-in session is invalid.');
  }
  return session;
}

export async function storeSession(session: AuthSession): Promise<void> {
  const value = JSON.stringify(session);
  if (Platform.OS === 'web') {
    window.localStorage.setItem(SESSION_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(SESSION_KEY, value);
}

export async function clearStoredSession(): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
