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
  profile: {
    displayName: string;
    role: UserRole;
    collaboratorId?: string;
    mustChangePassword?: boolean;
  }
): Promise<string> {
  // Instância secundária com nome único para não conflitar
  const secondaryAppName = `admin-create-${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = cred.user.uid;

    // Salva perfil no Firestore — mustChangePassword força a pessoa a trocar
    // a senha temporária definida pelo admin no primeiro acesso dela. O
    // admin decide isso na tela de criação (marcado por padrão).
    const userProfile: SystemUser = {
      uid,
      email,
      displayName: profile.displayName,
      role: profile.role,
      collaboratorId: profile.collaboratorId,
      disabled: false,
      createdAt: new Date().toISOString(),
      mustChangePassword: profile.mustChangePassword ?? true,
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
 * `url` é a "continue URL" para onde o Firebase manda o usuário depois de
 * concluir a troca de senha. `handleCodeInApp` é só para apps mobile — em
 * apps web deve ficar false, senão o Firebase pode não processar o link
 * corretamente.
 *
 * Para o e-mail linkar DIRETO na tela do próprio sistema (em vez da página
 * genérica do Firebase), é preciso configurar em Firebase Console →
 * Authentication → Templates → "Redefinição de senha" → editar →
 * "Personalizar URL de ação", apontando para o domínio de produção (ex:
 * https://sobreaviso-casacaresc.vercel.app). Esse domínio também precisa
 * estar em Authentication → Settings → Authorized domains.
 */
export async function adminSendPasswordReset(email: string): Promise<void> {
  const { auth } = await import('./config');
  await fbSendReset(auth, email, {
    url: window.location.origin,
    handleCodeInApp: false,
  });
}
