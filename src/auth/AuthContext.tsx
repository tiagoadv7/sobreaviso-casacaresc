import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updatePassword as fbUpdatePassword,
  updateProfile as fbUpdateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import {
  getUserProfile,
  saveUserProfile,
  subscribeUsers,
  updateUserProfile,
  seedInitialDataIfEmpty,
} from '../firebase/db';
import { adminCreateUser, adminSendPasswordReset } from '../firebase/adminSdk';
import { SystemUser, UserRole } from '../types';

// Admin padrão prioritário
export const PRIMARY_ADMIN_EMAIL = 'tiago.neves@casacaresc.org.br';

// ─── Session ─────────────────────────────────────────────────────────────────

export interface AuthSession {
  uid: string;
  email: string;
  role: UserRole;
  collaboratorId?: string;
  displayName: string;
  mustChangePassword: boolean;
}

// ─── Context value ────────────────────────────────────────────────────────────

interface AuthContextValue {
  session: AuthSession | null;
  users: SystemUser[];
  authLoading: boolean;          // true enquanto Firebase verifica a sessão
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changeMyPassword: (newPassword: string) => Promise<void>;
  completeFirstAccess: (newPassword: string) => Promise<void>;
  createUser: (
    email: string,
    password: string,
    data: { displayName: string; role: UserRole; collaboratorId?: string }
  ) => Promise<string>;
  updateUserRole: (uid: string, role: UserRole) => Promise<void>;
  updateUserCollaboratorLink: (uid: string, collaboratorId: string | null) => Promise<void>;
  updateUserDisplayName: (uid: string, displayName: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  disableUser: (uid: string) => Promise<void>;
  enableUser: (uid: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [authLoading, setAuthLoading] = useState(true);

  // Escuta mudanças de autenticação do Firebase
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        setSession(null);
        setAuthLoading(false);
        return;
      }

      try {
        const userEmail = (firebaseUser.email || '').toLowerCase().trim();
        const isPrimaryAdmin = userEmail === PRIMARY_ADMIN_EMAIL.toLowerCase();

        // Busca perfil no Firestore
        let profile = await getUserProfile(firebaseUser.uid);

        // Se for o admin principal tiago.neves@casacaresc.org.br ou não existir perfil
        if (!profile) {
          profile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: isPrimaryAdmin
              ? 'Tiago Neves'
              : firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
            role: isPrimaryAdmin ? 'admin' : 'colaborador',
            disabled: false,
            createdAt: new Date().toISOString(),
          };
          await saveUserProfile(firebaseUser.uid, profile);
        } else if (isPrimaryAdmin && profile.role !== 'admin') {
          // Garante que o email do Tiago Neves seja sempre admin
          profile.role = 'admin';
          if (!profile.displayName || profile.displayName === 'Admin') {
            profile.displayName = 'Tiago Neves';
          }
          await saveUserProfile(firebaseUser.uid, profile);
        }

        if (profile.disabled) {
          await signOut(auth);
          setSession(null);
          setAuthLoading(false);
          return;
        }

        const newSession: AuthSession = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          role: profile.role,
          collaboratorId: profile.collaboratorId,
          displayName: profile.displayName,
          mustChangePassword: profile.mustChangePassword ?? false,
        };

        setSession(newSession);

        // Seed inicial quando admin loga
        if (profile.role === 'admin') {
          await seedInitialDataIfEmpty();
        }
      } catch (err) {
        console.error('Erro ao carregar perfil do usuário:', err);
        setSession(null);
      } finally {
        setAuthLoading(false);
      }
    });

    return unsub;
  }, []);

  // Escuta todos os usuários (para o painel admin)
  useEffect(() => {
    const unsub = subscribeUsers(setUsers);
    return unsub;
  }, []);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setSession(null);
  }, []);

  const changeMyPassword = useCallback(async (newPassword: string) => {
    if (!auth.currentUser) throw new Error('Nenhum usuário logado');
    await fbUpdatePassword(auth.currentUser, newPassword);
  }, []);

  // Primeiro acesso: define a senha definitiva no lugar da temporária e
  // libera a entrada normal no sistema.
  const completeFirstAccess = useCallback(async (newPassword: string) => {
    if (!auth.currentUser) throw new Error('Nenhum usuário logado');
    await fbUpdatePassword(auth.currentUser, newPassword);
    await updateUserProfile(auth.currentUser.uid, { mustChangePassword: false });
    setSession((prev) => prev ? { ...prev, mustChangePassword: false } : prev);
  }, []);

  const createUser = useCallback(async (
    email: string,
    password: string,
    data: { displayName: string; role: UserRole; collaboratorId?: string }
  ) => {
    return adminCreateUser(email, password, data);
  }, []);

  const updateUserRole = useCallback(async (uid: string, role: UserRole) => {
    await updateUserProfile(uid, { role });
    setSession((prev) => prev?.uid === uid ? { ...prev, role } : prev);
  }, []);

  const updateUserCollaboratorLink = useCallback(async (uid: string, collaboratorId: string | null) => {
    await updateUserProfile(uid, {
      collaboratorId: collaboratorId ?? undefined,
    });
    setSession((prev) =>
      prev?.uid === uid
        ? { ...prev, collaboratorId: collaboratorId ?? undefined }
        : prev
    );
  }, []);

  const updateUserDisplayName = useCallback(async (uid: string, displayName: string) => {
    await updateUserProfile(uid, { displayName });
    if (auth.currentUser && auth.currentUser.uid === uid) {
      await fbUpdateProfile(auth.currentUser, { displayName });
    }
    setSession((prev) => prev?.uid === uid ? { ...prev, displayName } : prev);
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    await adminSendPasswordReset(email);
  }, []);

  const disableUser = useCallback(async (uid: string) => {
    await updateUserProfile(uid, { disabled: true });
  }, []);

  const enableUser = useCallback(async (uid: string) => {
    await updateUserProfile(uid, { disabled: false });
  }, []);

  const isAdmin = session?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        session,
        users,
        authLoading,
        isAdmin,
        login,
        logout,
        changeMyPassword,
        completeFirstAccess,
        createUser,
        updateUserRole,
        updateUserCollaboratorLink,
        updateUserDisplayName,
        sendPasswordReset,
        disableUser,
        enableUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
