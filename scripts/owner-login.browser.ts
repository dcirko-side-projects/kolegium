import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  initializeAuth,
  inMemoryPersistence,
  browserPopupRedirectResolver,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { appEnvironment } from '../src/app/core/config/app-environment';

// Setup-only Auth client. No Firestore imports, tokens or automatic owner approval.
const auth = initializeAuth(initializeApp(appEnvironment.firebase), {
  persistence: inMemoryPersistence,
  popupRedirectResolver: browserPopupRedirectResolver,
});
const button = document.querySelector<HTMLButtonElement>('#login')!;
const status = document.querySelector<HTMLElement>('#status')!;
const uid = document.querySelector<HTMLElement>('#uid')!;
button.addEventListener('click', async () => {
  button.disabled = true;
  uid.textContent = '';
  status.textContent = 'Prijava u tijeku…';
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    uid.textContent = result.user.uid;
    await signOut(auth);
    status.textContent =
      'Kopiraj UID ispod i pošalji ga u razgovor. Lokalna prijava je odjavljena.';
  } catch (error) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String(error.code)
        : 'unknown';
    status.textContent =
      code === 'auth/unauthorized-domain'
        ? 'U Firebase Authentication → Settings → Authorized domains dodaj localhost.'
        : `Prijava nije dovršena (${code}). Pokušaj ponovno ili pošalji ovu poruku.`;
  } finally {
    button.disabled = false;
  }
});
