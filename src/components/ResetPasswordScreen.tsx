import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, AlertCircle, Lock, CheckCircle2 } from 'lucide-react';
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
} from 'firebase/auth';
import { auth } from '../firebase/config';

interface ResetPasswordScreenProps {
  oobCode: string;
}

type Status = 'checking' | 'ready' | 'invalid' | 'success';

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ oobCode }) => {
  const [status, setStatus] = useState<Status>('checking');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    verifyPasswordResetCode(auth, oobCode)
      .then((verifiedEmail) => {
        setEmail(verifiedEmail);
        setStatus('ready');
      })
      .catch(() => setStatus('invalid'));
  }, [oobCode]);

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

    setIsSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setStatus('success');
    } catch {
      setError('Não foi possível redefinir sua senha. O link pode ter expirado — solicite um novo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToLogin = () => {
    window.location.href = window.location.origin;
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
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
            <h1 className="text-lg font-bold text-[#084F42] tracking-tight">Redefinir senha</h1>
          </div>

          {status === 'checking' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-6 h-6 border-2 border-[#319685]/30 border-t-[#319685] rounded-full animate-spin" />
              <p className="text-xs text-neutral-500">Verificando link…</p>
            </div>
          )}

          {status === 'invalid' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-medium text-red-600 bg-red-50 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#E84A4E]" />
                <span>Este link de redefinição é inválido ou já expirou. Solicite um novo pela tela de login.</span>
              </div>
              <button
                type="button"
                onClick={goToLogin}
                className="w-full py-3 rounded-2xl text-xs font-bold text-white transition-all cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #319685, #084F42)' }}
              >
                Voltar para o login
              </button>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Senha redefinida com sucesso!</span>
              </div>
              <button
                type="button"
                onClick={goToLogin}
                className="w-full py-3 rounded-2xl text-xs font-bold text-white transition-all cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #319685, #084F42)' }}
              >
                Ir para o login
              </button>
            </div>
          )}

          {status === 'ready' && (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <p className="text-xs text-neutral-500 text-center -mt-2">
                Definindo nova senha para <b className="text-neutral-800">{email}</b>
              </p>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-700">
                  Nova senha (mín. 6 caracteres)
                </label>
                <div className="relative">
                  <input
                    id="reset-new-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                  id="reset-confirm-password"
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
                id="btn-confirm-reset"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-2xl text-xs font-bold text-white transition-all cursor-pointer mt-1 flex items-center justify-center gap-2 disabled:opacity-70"
                style={{
                  background: 'linear-gradient(135deg, #319685, #084F42)',
                  boxShadow: '0 8px 24px rgba(49, 150, 133, 0.35)',
                }}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Salvando…</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Redefinir senha</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
