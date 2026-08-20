/**
 * Admin user management — cria usuários no Firebase Auth sem deslogar o admin.
 * Usa uma segunda instância do Firebase App (padrão recomendado para apps client-side).
 */
import {
  initializeApp,
  deleteApp,
  getApps,
} from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail as fbSendReset,
} from 'firebase/auth';
import { firebaseConfig } from './config';
import { saveUserProfile } from './db';
import { SystemUser, UserRole } from '../types';

/**
 * Cria um novo usuário no Firebase Auth sem deslogar o admin atual.
 * Retorna o UID do novo usuário.
 */
export async function adminCreateUser(
  email: string,
  password: string,
  profile: { displayName: string; role: UserRole; collaboratorId?: string }
): Promise<string> {
  // Instância secundária com nome único para não conflitar
  const secondaryAppName = `admin-create-${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = cred.user.uid;

    // Salva perfil no Firestore
    const userProfile: SystemUser = {
      uid,
      email,
      displayName: profile.displayName,
      role: profile.role,
      collaboratorId: profile.collaboratorId,
      disabled: false,
      createdAt: new Date().toISOString(),
    };
    await saveUserProfile(uid, userProfile);

    // Desloga da instância secundária e apaga o app temporário
    await fbSignOut(secondaryAuth);
    await deleteApp(secondaryApp);

    return uid;
  } catch (err) {
    // Garante limpeza mesmo em erro
    try { await deleteApp(secondaryApp); } catch { /* ignore */ }
    throw err;
  }
}

/**
 * Envia email de redefinição de senha para o usuário.
 * O link aponta para o próprio domínio em que o app está rodando (ex: a URL
 * da Vercel em produção, ou localhost em desenvolvimento) para que a troca
 * de senha aconteça na tela do próprio sistema, não na página genérica do
 * Firebase. Esse domínio precisa estar em Firebase Console → Authentication
 * → Settings → Authorized domains.
 */
export async function adminSendPasswordReset(email: string): Promise<void> {
  const { auth } = await import('./config');
  await fbSendReset(auth, email, {
    url: window.location.origin,
    handleCodeInApp: true,
  });
}
