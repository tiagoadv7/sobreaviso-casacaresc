import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Lock, Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

type View = 'login' | 'forgot';
type MissingField = 'email' | 'password' | 'both' | null;

const MISSING_FIELD_COPY: Record<Exclude<MissingField, null>, { title: string; body: string; focusId: string }> = {
  email: {
    title: 'Insira seu e-mail',
    body: 'Preencha o campo de e-mail para continuar.',
    focusId: 'email',
  },
  password: {
    title: 'Insira sua senha',
    body: 'Preencha o campo de senha para continuar.',
    focusId: 'password',
  },
  both: {
    title: 'Preencha os campos',
    body: 'Informe seu e-mail e sua senha para continuar.',
    focusId: 'email',
  },
};

export const LoginScreen: React.FC = () => {
  const { login, sendPasswordReset } = useAuth();
  const [view, setView] = useState<View>('login');

  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [missingField, setMissingField] = useState<MissingField>(null);

  const getErrorMessage = (code: string): string => {
    const messages: Record<string, string> = {
      'auth/configuration-not-found': 'O Firebase Authentication ainda não foi iniciado no seu projeto! No console do Firebase, vá em "Authentication" e clique no botão azul "Primeiros Passos" (Get Started) e ative "E-mail/senha".',
      'auth/operation-not-allowed': 'O provedor E-mail/Senha não está ativado no Firebase! Acesse o Firebase Console → Authentication → Sign-in method e ative "E-mail/senha".',
      'auth/user-not-found': 'E-mail não encontrado. Fale com o administrador para criar seu acesso.',
      'auth/wrong-password': 'Senha incorreta. Tente novamente.',
      'auth/missing-password': 'Digite sua senha para entrar.',
      'auth/missing-email': 'Digite seu e-mail para entrar.',
      'auth/invalid-email': 'E-mail inválido. Verifique o formato.',
      'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos.',
      'auth/user-disabled': 'Esta conta foi desativada. Contate o administrador.',
      'auth/invalid-credential': 'E-mail ou senha incorretos.',
      'auth/network-request-failed': 'Sem conexão com a internet.',
      'auth/api-key-not-valid': 'API Key do Firebase inválida. Verifique o arquivo .env.',
    };
    return messages[code] || 'Erro na autenticação. Verifique os dados e tente novamente.';
  };

  const goToView = (next: View) => {
    setView(next);
    setError('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailMissing = !emailInput.trim();
    const passwordMissing = !passwordInput;
    if (emailMissing || passwordMissing) {
      setMissingField(emailMissing && passwordMissing ? 'both' : emailMissing ? 'email' : 'password');
      return;
    }
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      await login(emailInput.trim(), passwordInput);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setError(getErrorMessage(code));
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setMissingField('email');
      return;
    }
    setError('');
    setSuccessMsg('');
    setIsLoading(true);
    try {
      await sendPasswordReset(emailInput.trim());
      setSuccessMsg(`Link de redefinição enviado para ${emailInput.trim()}. Verifique sua caixa de entrada.`);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code === 'auth/user-not-found') {
        setError('Este e-mail ainda não está cadastrado. Fale com o administrador.');
      } else {
        setError('Erro ao enviar e-mail. Tente novamente mais tarde.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #084F42 0%, #1e1e1c 50%, #084F42 100%)' }}
    >
      {/* Decorative brand blobs */}
      <div
        className="absolute top-[-120px] left-[-120px] w-[480px] h-[480px] rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #319685, transparent 70%)' }}
      />
      <div
        className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #6BC0B2, transparent 70%)' }}
      />
      <div
        className="absolute top-1/2 left-1/4 w-[300px] h-[300px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #9AD0BE, transparent 70%)' }}
      />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-sm mx-4"
        style={{ animation: shake ? 'shake 0.5s ease-in-out' : undefined }}
      >
        <div
          style={{
            background: '#ffffff',
            borderRadius: '28px',
            padding: '36px 32px',
            boxShadow: '0 32px 64px rgba(8, 79, 66, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Brand */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <img src="/logo.svg" alt="Casacaresc" className="w-44 h-auto" />
            <h1 className="text-lg font-bold text-[#084F42] tracking-tight">
              {view === 'login' ? 'Sobreaviso' : 'Recuperar senha'}
            </h1>
          </div>

          {view === 'login' ? (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Email */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#319685]" /> E-mail
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@casacaresc.org.br"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-medium text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#319685]/30 transition-all"
                />
              </div>

              {/* Senha */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-700">Senha</label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full pl-4 pr-12 py-2.5 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-medium text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#319685]/30 transition-all"
                  />
                  <button
                    type="button"
                    id="toggle-password"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Esqueceu a senha */}
              <div className="flex justify-end">
                <button
                  type="button"
                  id="btn-forgot-password"
                  onClick={() => goToView('forgot')}
                  className="text-[11px] text-[#319685] hover:text-[#084F42] transition-colors cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-medium text-red-600 bg-red-50 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#E84A4E]" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                id="btn-login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-2xl text-xs font-bold text-white transition-all cursor-pointer mt-1 flex items-center justify-center gap-2"
                style={{
                  background: isLoading
                    ? 'rgba(49, 150, 133, 0.6)'
                    : 'linear-gradient(135deg, #319685, #084F42)',
                  boxShadow: isLoading ? 'none' : '0 8px 24px rgba(49, 150, 133, 0.35)',
                  opacity: isLoading ? 0.8 : 1,
                }}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Carregando…</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Entrar no sistema</span>
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-neutral-400 pt-1">
                Não tem acesso? Fale com o administrador do sistema.
              </p>
            </form>
          ) : (
            <form onSubmit={handleSendResetLink} className="space-y-3.5">
              <p className="text-xs text-neutral-500 text-center -mt-2 leading-relaxed">
                Digite seu e-mail cadastrado. Vamos enviar um link para você definir uma nova senha.
              </p>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#319685]" /> E-mail
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@casacaresc.org.br"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-medium text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#319685]/30 transition-all"
                />
              </div>

              {successMsg && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-medium text-red-600 bg-red-50 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#E84A4E]" />
                  <span>{error}</span>
                </div>
              )}

              <button
                id="btn-send-reset-link"
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
                    <span>Enviando…</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar link para redefinir senha</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => goToView('login')}
                className="w-full flex items-center justify-center gap-1.5 text-[11px] text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer pt-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar para o login
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Modal: campo obrigatório não preenchido */}
      {missingField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-black/8 w-full max-w-xs mx-4 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#319685]/10 flex items-center justify-center">
                {missingField === 'password' ? (
                  <Lock className="w-6 h-6 text-[#319685]" />
                ) : (
                  <Mail className="w-6 h-6 text-[#319685]" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">{MISSING_FIELD_COPY[missingField].title}</h3>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  {MISSING_FIELD_COPY[missingField].body}
                </p>
              </div>
            </div>
            <button
              type="button"
              autoFocus
              onClick={() => {
                const focusTarget = MISSING_FIELD_COPY[missingField].focusId;
                setMissingField(null);
                const inputId = focusTarget === 'password'
                  ? 'login-password'
                  : view === 'login' ? 'login-email' : 'forgot-email';
                document.getElementById(inputId)?.focus();
              }}
              className="w-full py-2.5 rounded-2xl bg-[#319685] text-white text-xs font-bold hover:bg-[#084F42] shadow-md shadow-[#319685]/25 transition-all cursor-pointer"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
          90% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
};
