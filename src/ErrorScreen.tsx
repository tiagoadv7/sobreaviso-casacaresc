import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const ErrorScreen: React.FC<{ error: Error }> = ({ error }) => {
  const isFirebaseConfigError =
    /invalid-api-key|api-key-not-valid|configuration-not-found|Firebase/i.test(error.message);

  return (
    <div
      className="min-h-dvh w-full flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #084F42 0%, #1e1e1c 50%, #084F42 100%)' }}
    >
      <div className="w-full max-w-md bg-white rounded-[28px] shadow-2xl p-8 space-y-4">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#E84A4E]/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-[#E84A4E]" />
          </div>
          <h1 className="text-base font-bold text-neutral-900">Não foi possível carregar o sistema</h1>
        </div>

        {isFirebaseConfigError ? (
          <p className="text-xs text-neutral-600 leading-relaxed text-center">
            As credenciais do Firebase não foram encontradas neste ambiente. Se este é um deploy
            (Vercel, etc.), verifique se as variáveis <code className="bg-neutral-100 px-1 rounded">VITE_FIREBASE_*</code> foram
            adicionadas nas configurações do projeto e se um novo deploy foi feito depois disso.
          </p>
        ) : (
          <p className="text-xs text-neutral-600 leading-relaxed text-center">
            Ocorreu um erro inesperado. Tente recarregar a página; se persistir, contate o administrador.
          </p>
        )}

        <div className="bg-neutral-50 border border-black/5 rounded-2xl p-3 text-[11px] text-neutral-500 font-mono break-words">
          {error.message}
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full py-2.5 rounded-2xl text-xs font-bold text-white transition-all cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #319685, #084F42)' }}
        >
          Recarregar página
        </button>
      </div>
    </div>
  );
};
