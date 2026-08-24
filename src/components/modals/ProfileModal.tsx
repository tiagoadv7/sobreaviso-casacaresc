import React, { useState, useEffect } from 'react';
import { Collaborator, UserRole } from '../../types';
import { X, User, Phone, FileText, KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck, Mail } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

interface ProfileModalProps {
  isOpen: boolean;
  collaborator: Collaborator | null; // perfil de colaborador se vinculado
  initialTab?: 'profile' | 'password';
  onClose: () => void;
  onSaveProfile: (updated: Partial<Collaborator>, id: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  collaborator,
  initialTab = 'profile',
  onClose,
  onSaveProfile,
}) => {
  const { session, changeMyPassword, updateUserDisplayName } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // Profile data
  const [displayName, setDisplayName] = useState('');
  const [contact, setContact] = useState('');
  const [note, setNote] = useState('');

  // Password data
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (session) {
      setDisplayName(session.displayName || '');
    }
    if (collaborator) {
      setContact(collaborator.contact || '');
      setNote(collaborator.note || '');
    }
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setActiveTab(initialTab);
  }, [session, collaborator, isOpen, initialTab]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('O nome não pode estar vazio.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (session) {
        await updateUserDisplayName(session.uid, displayName.trim());
      }
      if (collaborator) {
        onSaveProfile(
          { name: displayName.trim(), contact: contact.trim(), note: note.trim() },
          collaborator.id
        );
      }
      setSuccess('Perfil atualizado com sucesso!');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1000);
    } catch {
      setError('Erro ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('A confirmação de senha não confere.');
      return;
    }

    setLoading(true);
    try {
      await changeMyPassword(newPassword);
      setSuccess('Senha alterada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/requires-recent-login') {
        setError('Por segurança, faça login novamente antes de alterar a senha.');
      } else {
        setError('Erro ao alterar senha. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = session?.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl w-full max-w-md p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900">Minha Conta</h3>
            <p className="text-xs text-neutral-400 font-medium mt-0.5">
              Gerencie seus dados de acesso e perfil.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Card Info */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-50 border border-black/5">
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${
              isAdmin ? 'bg-[#084F42]' : 'bg-[#319685]'
            }`}
          >
            {session?.displayName ? session.displayName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-neutral-900 truncate">
                {session?.displayName || 'Usuário'}
              </p>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isAdmin
                    ? 'bg-[#319685]/15 text-[#084F42]'
                    : 'bg-[#6BC0B2]/20 text-[#319685]'
                }`}
              >
                {isAdmin ? 'Administrador' : 'Colaborador'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 truncate flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3 text-neutral-400" /> {session?.email}
            </p>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1 p-1 bg-neutral-100 rounded-2xl">
          <button
            type="button"
            onClick={() => { setActiveTab('profile'); setError(''); setSuccess(''); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Dados Pessoais
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('password'); setError(''); setSuccess(''); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'password'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" /> Alterar Senha
          </button>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-2xl border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* TAB 1: Profile */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-neutral-400" /> Nome Completo *
              </label>
              <input
                id="profile-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="Seu nome"
                className="w-full px-3.5 py-2 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#319685]/30 shadow-2xs"
              />
            </div>

            {/* Colaborador só pode alterar nome e senha — os demais campos
                do cadastro (contato, observação, função, matrícula, cor,
                status) só ficam visíveis/editáveis pelo administrador,
                através da tela de Colaboradores. */}
            {collaborator && isAdmin && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" /> Telefone / WhatsApp
                  </label>
                  <input
                    id="profile-contact"
                    type="text"
                    placeholder="(11) 90000-0000"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#319685]/30 shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-neutral-400" /> Observação
                  </label>
                  <input
                    id="profile-note"
                    type="text"
                    placeholder="Ex: Disponível para trocas de escala"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#319685]/30 shadow-2xs"
                  />
                </div>
              </>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-2xl border border-black/10 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="btn-save-profile"
                disabled={loading}
                className="px-5 py-2 rounded-2xl bg-[#319685] text-white text-xs font-semibold hover:bg-[#084F42] shadow-md shadow-[#319685]/25 transition-all cursor-pointer disabled:opacity-60"
              >
                {loading ? 'Salvando...' : 'Salvar dados'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Change Password */}
        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700">
                Nova Senha * (mínimo 6 caracteres)
              </label>
              <div className="relative">
                <input
                  id="profile-new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full pl-3.5 pr-10 py-2 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#319685]/30 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700">
                Confirmar Nova Senha *
              </label>
              <input
                id="profile-confirm-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#319685]/30 shadow-2xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-2xl border border-black/10 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="btn-change-password-submit"
                disabled={loading || !newPassword}
                className="px-5 py-2 rounded-2xl bg-[#319685] text-white text-xs font-semibold hover:bg-[#084F42] shadow-md shadow-[#319685]/25 transition-all cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                {loading ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
