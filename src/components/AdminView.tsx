import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  KeyRound,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  Crown,
  Pencil,
  Plus,
  Mail,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  X,
  AlertCircle,
  Database,
  Trash2,
} from 'lucide-react';
import { Collaborator, SystemUser, UserRole } from '../types';
import { useAuth } from '../auth/AuthContext';
import { forceSyncInitialData, clearAllCollaborators, saveCollaborator, syncCollaboratorsFromUsers } from '../firebase/db';
import { PALETTE } from '../utils/constants';
import { CustomSelect, SelectOption } from './CustomSelect';
import { ConfirmModal } from './modals/ConfirmModal';

interface AdminViewProps {
  collaborators: Collaborator[];
  onOpenCollaboratorModal: (id?: string) => void;
  onDeleteCollaborator: (id: string) => void;
}

type AdminTab = 'usuarios' | 'colaboradores';

export const AdminView: React.FC<AdminViewProps> = ({
  collaborators,
  onOpenCollaboratorModal,
  onDeleteCollaborator,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('usuarios');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#319685]/15 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-[#084F42]" />
        </div>
        <div>
          <h2 className="text-base font-bold text-neutral-900">Painel do Administrador</h2>
          <p className="text-xs text-neutral-500">Gerencie usuários, funções e colaboradores do sistema.</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 bg-neutral-100 rounded-2xl w-fit">
        {(
          [
            { id: 'usuarios', label: 'Usuários do sistema', icon: <KeyRound className="w-3.5 h-3.5" /> },
            { id: 'colaboradores', label: 'Colaboradores', icon: <Users className="w-3.5 h-3.5" /> },
          ] as { id: AdminTab; label: string; icon: React.ReactNode }[]
        ).map((tab) => (
          <button
            key={tab.id}
            id={`admin-tab-${tab.id}`}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-[#084F42] shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'usuarios' && <UsersPanel collaborators={collaborators} />}
      {activeTab === 'colaboradores' && (
        <ColaboradoresAdminPanel
          collaborators={collaborators}
          onOpenModal={onOpenCollaboratorModal}
          onDelete={onDeleteCollaborator}
        />
      )}
    </div>
  );
};

/* ─── Painel de Usuários Firebase ─── */
const UsersPanel: React.FC<{ collaborators: Collaborator[] }> = ({ collaborators }) => {
  const { users, session, createUser, updateUserRole, updateUserCollaboratorLink,
    updateUserDisplayName, sendPasswordReset, disableUser, enableUser } = useAuth();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [feedback, setFeedback] = useState<{ uid: string; msg: string; type: 'ok' | 'err' } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isLinkingCollabs, setIsLinkingCollabs] = useState(false);
  const [linkCollabsStatus, setLinkCollabsStatus] = useState<string | null>(null);

  const collaboratorIds = new Set(collaborators.map((c) => c.id));
  const usersMissingCollaborator = users.filter(
    (u) => !u.collaboratorId || !collaboratorIds.has(u.collaboratorId)
  ).length;

  const showFeedback = (uid: string, msg: string, type: 'ok' | 'err' = 'ok') => {
    setFeedback({ uid, msg, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSyncDatabase = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      await forceSyncInitialData();
      setSyncStatus('✓ Banco Firestore sincronizado com todas as informações!');
      setTimeout(() => setSyncStatus(null), 4000);
    } catch {
      setSyncStatus('Erro ao sincronizar. Verifique as regras do Firestore.');
      setTimeout(() => setSyncStatus(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLinkCollaborators = async () => {
    setIsLinkingCollabs(true);
    setLinkCollabsStatus(null);
    try {
      const created = await syncCollaboratorsFromUsers(users, collaborators);
      setLinkCollabsStatus(
        created > 0
          ? `✓ ${created} colaborador${created !== 1 ? 'es' : ''} criado${created !== 1 ? 's' : ''} a partir dos usuários.`
          : 'Todos os usuários já têm um colaborador vinculado.'
      );
      setTimeout(() => setLinkCollabsStatus(null), 4000);
    } catch {
      setLinkCollabsStatus('Erro ao gerar colaboradores. Verifique as regras do Firestore.');
      setTimeout(() => setLinkCollabsStatus(null), 4000);
    } finally {
      setIsLinkingCollabs(false);
    }
  };

  const handlePasswordReset = async (user: SystemUser) => {
    try {
      await sendPasswordReset(user.email);
      showFeedback(user.uid, 'E-mail de redefinição enviado com sucesso!');
    } catch {
      showFeedback(user.uid, 'Erro ao enviar e-mail.', 'err');
    }
  };

  const handleToggleRole = async (user: SystemUser) => {
    const newRole: UserRole = user.role === 'admin' ? 'colaborador' : 'admin';
    try {
      await updateUserRole(user.uid, newRole);
      showFeedback(user.uid, `Função alterada para ${newRole === 'admin' ? 'Administrador' : 'Colaborador'}.`);
    } catch {
      showFeedback(user.uid, 'Erro ao alterar função.', 'err');
    }
  };

  const handleToggleDisabled = async (user: SystemUser) => {
    try {
      if (user.disabled) await enableUser(user.uid);
      else await disableUser(user.uid);
      showFeedback(user.uid, user.disabled ? 'Conta reativada.' : 'Conta desativada.');
    } catch {
      showFeedback(user.uid, 'Erro ao alterar status.', 'err');
    }
  };

  return (
    <div className="space-y-4">
      {/* Sync feedback */}
      {syncStatus && (
        <div className="p-3 rounded-2xl bg-[#DEEDE0] text-[#084F42] border border-[#319685]/30 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Database className="w-4 h-4 text-[#319685]" />
          <span>{syncStatus}</span>
        </div>
      )}
      {linkCollabsStatus && (
        <div className="p-3 rounded-2xl bg-[#DEEDE0] text-[#084F42] border border-[#319685]/30 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Users className="w-4 h-4 text-[#319685]" />
          <span>{linkCollabsStatus}</span>
        </div>
      )}

      {usersMissingCollaborator > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium flex items-center justify-between flex-wrap gap-2">
          <span>
            {usersMissingCollaborator} usuário{usersMissingCollaborator !== 1 ? 's' : ''} sem colaborador vinculado —
            {usersMissingCollaborator !== 1 ? ' eles não aparecem' : ' ele não aparece'} na aba Colaboradores.
          </span>
          <button
            type="button"
            onClick={handleLinkCollaborators}
            disabled={isLinkingCollabs}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-all cursor-pointer disabled:opacity-60 shrink-0"
          >
            <Users className="w-3.5 h-3.5" />
            <span>{isLinkingCollabs ? 'Gerando…' : 'Gerar colaboradores agora'}</span>
          </button>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-neutral-500 font-medium">
          {users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}
        </p>

        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSyncDatabase}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-[#319685]/30 bg-[#DEEDE0]/40 text-[#084F42] text-xs font-semibold hover:bg-[#DEEDE0] transition-all cursor-pointer disabled:opacity-60"
            title="Popula ou restaura colaboradores, demandas e chamados no Firestore"
          >
            <Database className="w-3.5 h-3.5 text-[#319685]" />
            <span>{isSyncing ? 'Sincronizando…' : 'Sincronizar Banco de Dados'}</span>
          </button>

          <button
            id="admin-btn-create-user"
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#319685] text-white text-xs font-semibold hover:bg-[#084F42] shadow-sm shadow-[#319685]/30 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Criar usuário
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.uid} className={`bg-neutral-50 border rounded-2xl p-4 space-y-3 transition-all ${u.disabled ? 'opacity-60 border-red-100' : 'border-black/5'}`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  u.role === 'admin' ? 'bg-[#084F42] text-white' : 'bg-[#319685]/15 text-[#319685]'
                }`}>
                  {u.role === 'admin' ? <Crown className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-neutral-900">{u.displayName}</p>
                    {u.disabled && (
                      <span className="text-[10px] bg-red-100 text-red-600 font-semibold px-1.5 py-0.5 rounded-full">
                        Desativado
                      </span>
                    )}
                    {u.uid === session?.uid && (
                      <span className="text-[10px] bg-[#6BC0B2]/20 text-[#084F42] font-semibold px-1.5 py-0.5 rounded-full">
                        Você
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    {u.email} · {u.role === 'admin' ? '🛡️ Administrador' : '👤 Colaborador'}
                    {u.collaboratorId && ` · vinculado: ${u.collaboratorId}`}
                  </p>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {feedback?.uid === u.uid && (
                  <span className={`text-[11px] font-medium flex items-center gap-1 ${
                    feedback.type === 'ok' ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {feedback.type === 'ok' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {feedback.msg}
                  </span>
                )}

                {/* Editar */}
                <button
                  id={`btn-edit-user-${u.uid}`}
                  type="button"
                  onClick={() => setEditingUser(u)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-black/10 text-[11px] font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  <Pencil className="w-3 h-3" /> Editar
                </button>

                {/* Trocar role */}
                <button
                  id={`btn-role-${u.uid}`}
                  type="button"
                  onClick={() => handleToggleRole(u)}
                  disabled={u.uid === session?.uid}
                  title={u.uid === session?.uid ? 'Não pode alterar a própria função' : undefined}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-black/10 text-[11px] font-semibold text-neutral-600 hover:bg-[#DEEDE0]/60 hover:text-[#084F42] hover:border-[#6BC0B2]/40 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Crown className="w-3 h-3" />
                  {u.role === 'admin' ? 'Tornar colaborador' : 'Tornar admin'}
                </button>

                {/* Reset senha */}
                <button
                  id={`btn-reset-${u.uid}`}
                  type="button"
                  onClick={() => handlePasswordReset(u)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-black/10 text-[11px] font-semibold text-neutral-600 hover:bg-[#319685]/10 hover:text-[#084F42] hover:border-[#319685]/30 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Resetar senha
                </button>

                {/* Ativar/desativar */}
                {u.uid !== session?.uid && (
                  <button
                    id={`btn-toggle-${u.uid}`}
                    type="button"
                    onClick={() => handleToggleDisabled(u)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-colors cursor-pointer ${
                      u.disabled
                        ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                        : 'border-[#E84A4E]/20 text-[#E84A4E] hover:bg-[#E84A4E]/10'
                    }`}
                  >
                    {u.disabled ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                    {u.disabled ? 'Ativar' : 'Desativar'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal criar usuário */}
      {showCreateModal && (
        <CreateUserModal
          collaborators={collaborators}
          onClose={() => setShowCreateModal(false)}
          onCreate={createUser}
          onLinkCollaborator={updateUserCollaboratorLink}
          onSendReset={sendPasswordReset}
        />
      )}

      {/* Modal editar usuário */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          collaborators={collaborators}
          onClose={() => setEditingUser(null)}
          onUpdateName={updateUserDisplayName}
          onUpdateCollab={updateUserCollaboratorLink}
        />
      )}
    </div>
  );
};

/* ─── Modal: Criar Usuário ─── */
const CreateUserModal: React.FC<{
  collaborators: Collaborator[];
  onClose: () => void;
  onCreate: (email: string, password: string, data: { displayName: string; role: UserRole; collaboratorId?: string }) => Promise<string>;
  onLinkCollaborator: (uid: string, collaboratorId: string | null) => Promise<void>;
  onSendReset: (email: string) => Promise<void>;
}> = ({ collaborators, onClose, onCreate, onLinkCollaborator, onSendReset }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [matricula, setMatricula] = useState('');
  const [role, setRole] = useState<UserRole>('colaborador');
  const [collaboratorId, setCollaboratorId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOrphanConflict, setIsOrphanConflict] = useState(false);
  const [resetStatus, setResetStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName) { setError('Preencha todos os campos obrigatórios.'); return; }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    setLoading(true);
    setError('');
    setIsOrphanConflict(false);
    setResetStatus('');
    try {
      // Cria o usuário primeiro — só depois de confirmado que ele existe é
      // que criamos o colaborador, para não sobrar um colaborador órfão no
      // Firestore caso a criação do usuário falhe (ex: e-mail duplicado).
      const uid = await onCreate(email.trim(), password, {
        displayName: displayName.trim(),
        role,
        collaboratorId: collaboratorId || undefined,
      });

      // Se nenhum colaborador existente foi selecionado, cria um novo
      // automaticamente com o mesmo nome e vincula ao usuário recém-criado.
      if (!collaboratorId) {
        const newCollaboratorId = await saveCollaborator({
          name: displayName.trim(),
          role: '',
          matricula: matricula.trim(),
          contact: '',
          color: PALETTE[collaborators.length % PALETTE.length],
          status: 'ativo',
          note: '',
        });
        await onLinkCollaborator(uid, newCollaboratorId);
      }

      onClose();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      const message = (err as { message?: string }).message;
      if (code === 'auth/email-already-in-use') {
        setError('Este e-mail já está cadastrado, mas sem perfil no sistema.');
        setIsOrphanConflict(true);
      }
      else if (code === 'auth/invalid-email') setError('E-mail inválido.');
      else if (code === 'auth/weak-password') setError('Senha muito fraca para os critérios do Firebase.');
      else setError(message ? `Erro ao criar usuário: ${message}` : 'Erro ao criar usuário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl w-full max-w-md p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900">Criar novo usuário</h3>
            <p className="text-xs text-neutral-400 mt-0.5">O usuário receberá acesso ao sistema com estas credenciais.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl text-neutral-400 hover:bg-neutral-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-2xl border border-red-200">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            {isOrphanConflict && (
              <>
                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  Envie um link de redefinição para a pessoa completar o próprio cadastro, ou exclua a conta em Firebase Console → Authentication → Users.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    setResetStatus('Enviando…');
                    try {
                      await onSendReset(email.trim());
                      setResetStatus('✓ Link enviado para ' + email.trim());
                    } catch {
                      setResetStatus('Erro ao enviar o link. Tente novamente.');
                    }
                  }}
                  disabled={resetStatus === 'Enviando…'}
                  className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-2xl border border-[#319685]/30 bg-[#DEEDE0]/40 text-[#084F42] text-xs font-semibold hover:bg-[#DEEDE0] transition-all cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#319685]" />
                  Enviar link de redefinição de senha
                </button>
              </>
            )}
            {resetStatus && (
              <p className="text-[11px] text-neutral-500 text-center">{resetStatus}</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700">Nome completo *</label>
            <input type="text" placeholder="Ex: Fernanda Silva" value={displayName}
              onChange={(e) => setDisplayName(e.target.value)} required
              className="w-full px-3.5 py-2 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#319685]/30" />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#319685]" /> E-mail *
            </label>
            <input type="email" placeholder="email@casacaresc.org.br" value={email}
              onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-3.5 py-2 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#319685]/30" />
          </div>

          {/* Senha */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700">Senha inicial * (mín. 6 caracteres)</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} required
                className="w-full pl-3.5 pr-10 py-2 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#319685]/30" />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer">
                {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Função / Role */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700">Função no sistema *</label>
            <div className="flex gap-2">
              {(['colaborador', 'admin'] as UserRole[]).map((r) => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                    role === r
                      ? r === 'admin'
                        ? 'bg-[#084F42] border-[#084F42] text-white shadow-xs'
                        : 'bg-[#319685]/15 border-[#319685]/30 text-[#084F42]'
                      : 'border-black/10 text-neutral-500 hover:bg-neutral-50'
                  }`}>
                  {r === 'admin' ? <Crown className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  {r === 'admin' ? 'Administrador' : 'Colaborador'}
                </button>
              ))}
            </div>
          </div>

          {/* Vincular colaborador */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700">Vincular a colaborador existente (opcional)</label>
            <p className="text-[11px] text-neutral-400 -mt-0.5">
              Se deixar em "— Nenhum —", um colaborador novo com o nome acima é criado automaticamente.
            </p>
            <CustomSelect
              options={[
                { value: '', label: '— Nenhum — (criar novo automaticamente)' },
                ...collaborators.map((c): SelectOption => ({ value: c.id, label: `${c.name} (${c.role})`, color: c.color })),
              ]}
              value={collaboratorId}
              onChange={setCollaboratorId}
              placeholder="— Nenhum —"
            />
          </div>

          {/* Matrícula do novo colaborador (só faz sentido quando um novo
              colaborador vai ser criado — se um já existente foi selecionado
              acima, a matrícula dele é editada na tela de Colaboradores). */}
          {!collaboratorId && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700">Matrícula (opcional)</label>
              <input type="text" placeholder="Ex: 0007" value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#319685]/30" />
            </div>
          )}

          <div className="flex gap-2.5 pt-4 border-t border-black/5">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-2xl border border-black/10 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-2xl bg-[#319685] text-white text-xs font-semibold hover:bg-[#084F42] shadow-md shadow-[#319685]/25 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5">
              {loading ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Criando…</> : 'Criar usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Modal: Editar Usuário ─── */
const EditUserModal: React.FC<{
  user: SystemUser;
  collaborators: Collaborator[];
  onClose: () => void;
  onUpdateName: (uid: string, name: string) => Promise<void>;
  onUpdateCollab: (uid: string, collabId: string | null) => Promise<void>;
}> = ({ user, collaborators, onClose, onUpdateName, onUpdateCollab }) => {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [collaboratorId, setCollaboratorId] = useState(user.collaboratorId ?? '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await Promise.all([
      displayName !== user.displayName ? onUpdateName(user.uid, displayName) : Promise.resolve(),
      collaboratorId !== (user.collaboratorId ?? '') ? onUpdateCollab(user.uid, collaboratorId || null) : Promise.resolve(),
    ]);
    setLoading(false);
    setSaved(true);
    setTimeout(onClose, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl w-full max-w-sm p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900">Editar usuário</h3>
            <p className="text-xs text-neutral-400 mt-0.5">{user.email}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl text-neutral-400 hover:bg-neutral-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {saved && (
          <div className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-2xl border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" /> Alterações salvas!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700">Nome de exibição</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required
              className="w-full px-3.5 py-2 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#319685]/30" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700">Vincular a colaborador</label>
            <CustomSelect
              options={[
                { value: '', label: '— Nenhum —' },
                ...collaborators.map((c): SelectOption => ({ value: c.id, label: `${c.name} (${c.role})`, color: c.color })),
              ]}
              value={collaboratorId}
              onChange={setCollaboratorId}
              placeholder="— Nenhum —"
            />
          </div>

          <div className="flex gap-2.5 pt-4 border-t border-black/5">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-2xl border border-black/10 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-2xl bg-[#319685] text-white text-xs font-semibold hover:bg-[#084F42] transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5">
              {loading ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Painel de Colaboradores (admin) ─── */
const ColaboradoresAdminPanel: React.FC<{
  collaborators: Collaborator[];
  onOpenModal: (id?: string) => void;
  onDelete: (id: string) => void;
}> = ({ collaborators, onOpenModal, onDelete }) => {
  const [isClearing, setIsClearing] = useState(false);
  const [clearStatus, setClearStatus] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  const handleClearAll = async () => {
    setShowClearAllConfirm(false);
    setIsClearing(true);
    setClearStatus(null);
    try {
      const removed = await clearAllCollaborators();
      setClearStatus(`✓ ${removed} colaborador${removed !== 1 ? 'es' : ''} removido${removed !== 1 ? 's' : ''}.`);
      setTimeout(() => setClearStatus(null), 4000);
    } catch {
      setClearStatus('Erro ao limpar colaboradores. Verifique as regras do Firestore.');
      setTimeout(() => setClearStatus(null), 4000);
    } finally {
      setIsClearing(false);
    }
  };

  return (
  <div className="space-y-3">
    {clearStatus && (
      <div className="p-3 rounded-2xl bg-[#DEEDE0] text-[#084F42] border border-[#319685]/30 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
        <Database className="w-4 h-4 text-[#319685]" />
        <span>{clearStatus}</span>
      </div>
    )}

    <div className="flex items-center justify-between flex-wrap gap-2">
      <p className="text-xs text-neutral-500 font-medium">
        {collaborators.length} colaborador{collaborators.length !== 1 ? 'es' : ''} cadastrado{collaborators.length !== 1 ? 's' : ''}
      </p>
      <div className="flex items-center flex-wrap gap-2">
        {collaborators.length > 0 && (
          <button
            id="admin-btn-clear-collabs"
            type="button"
            onClick={() => setShowClearAllConfirm(true)}
            disabled={isClearing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-[#E84A4E]/20 text-[#E84A4E] text-xs font-semibold hover:bg-[#E84A4E]/10 transition-all cursor-pointer disabled:opacity-60"
            title="Remove todos os colaboradores cadastrados no Firestore"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isClearing ? 'Limpando…' : 'Limpar todos'}</span>
          </button>
        )}
        <button id="admin-btn-add-collab" type="button" onClick={() => onOpenModal()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#319685] text-white text-xs font-semibold hover:bg-[#084F42] shadow-sm shadow-[#319685]/30 transition-all cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> Adicionar colaborador
        </button>
      </div>
    </div>

    <div className="space-y-2">
      {collaborators.map((c) => (
        <div key={c.id} className="flex items-center justify-between flex-wrap gap-2 bg-neutral-50 border border-black/5 rounded-2xl px-4 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: c.color }}>
              {c.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-neutral-900 truncate">{c.name}</p>
              <p className="text-[11px] text-neutral-400 truncate">
                {c.role} · Mat. {c.matricula} ·{' '}
                <span className={c.status === 'ativo' ? 'text-emerald-600' : 'text-[#E84A4E]'}>
                  {c.status === 'ativo' ? 'Ativo' : 'Em licença'}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button id={`admin-edit-collab-${c.id}`} type="button" onClick={() => onOpenModal(c.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-black/10 text-[11px] font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer">
              <Pencil className="w-3 h-3" /> Editar
            </button>
            <button id={`admin-del-collab-${c.id}`} type="button" onClick={() => onDelete(c.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#E84A4E]/20 text-[11px] font-semibold text-[#E84A4E] hover:bg-[#E84A4E]/10 transition-colors cursor-pointer">
              Excluir
            </button>
          </div>
        </div>
      ))}
    </div>

    <ConfirmModal
      isOpen={showClearAllConfirm}
      title="Limpar todos os colaboradores"
      message={`Isso vai excluir permanentemente os ${collaborators.length} colaboradores cadastrados no Firestore. Deseja continuar?`}
      confirmLabel="Excluir todos"
      loading={isClearing}
      onConfirm={handleClearAll}
      onClose={() => setShowClearAllConfirm(false)}
    />
  </div>
  );
};
