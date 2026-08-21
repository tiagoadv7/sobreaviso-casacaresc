import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Lock } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export const FirstAccessScreen: React.FC = () => {
  const { session, completeFirstAccess, logout } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('A confirmação de senha não confere.');
      return;
    }

    setIsLoading(true);
    try {
      await completeFirstAccess(newPassword);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/requires-recent-login') {
        setError('Por segurança, faça login novamente e tente definir a senha em seguida.');
      } else {
        setError('Erro ao definir a senha. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-dvh w-full flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #084F42 0%, #1e1e1c 50%, #084F42 100%)' }}
    >
      <div
        className="absolute top-[-120px] left-[-120px] w-[480px] h-[480px] rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #319685, transparent 70%)' }}
      />
      <div
        className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #6BC0B2, transparent 70%)' }}
      />

      <div className="relative z-10 w-full max-w-sm mx-4">
        <div
          style={{
            background: '#ffffff',
            borderRadius: '28px',
            padding: '36px 32px',
            boxShadow: '0 32px 64px rgba(8, 79, 66, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div className="flex flex-col items-center gap-3 mb-6">
            <img src="/logo.svg" alt="Casacaresc" className="w-44 h-auto" />
            <h1 className="text-lg font-bold text-[#084F42] tracking-tight">Primeiro acesso</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <p className="text-xs text-neutral-500 text-center -mt-2 leading-relaxed">
              Bem-vindo(a), <b className="text-neutral-800">{session?.displayName}</b>! Por segurança, defina
              uma senha só sua antes de continuar.
            </p>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-700">
                Nova senha (mín. 6 caracteres)
              </label>
              <div className="relative">
                <input
                  id="first-access-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoFocus
                  className="w-full pl-4 pr-12 py-2.5 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-medium text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#319685]/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-700">Confirmar nova senha</label>
              <input
                id="first-access-confirm-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-medium text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#319685]/30 transition-all"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-medium text-red-600 bg-red-50 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#E84A4E]" />
                <span>{error}</span>
              </div>
            )}

            <button
              id="btn-complete-first-access"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-2xl text-xs font-bold text-white transition-all cursor-pointer mt-1 flex items-center justify-center gap-2 disabled:opacity-70"
              style={{
                background: 'linear-gradient(135deg, #319685, #084F42)',
                boxShadow: '0 8px 24px rgba(49, 150, 133, 0.35)',
              }}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvando…</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Definir senha e entrar</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={logout}
              className="w-full text-center text-[11px] text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer pt-1"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
