import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
import {ErrorBoundary} from './ErrorBoundary.tsx';
import {ErrorScreen} from './ErrorScreen.tsx';

const root = createRoot(document.getElementById('root')!);

// A configuração do Firebase (VITE_FIREBASE_*) precisa ser checada ANTES de
// importar App — o Firebase inicializa (e pode lançar erro) assim que o
// módulo é carregado, o que aconteceria antes do ErrorBoundary sequer
// existir na árvore, deixando a tela em branco sem nenhuma pista.
const missingEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
].filter((key) => !import.meta.env[key]);

if (missingEnvVars.length > 0) {
  const error = new Error(
    `Configuração do Firebase incompleta. Variáveis de ambiente ausentes: ${missingEnvVars.join(', ')}. ` +
    'Se este é um deploy (Vercel, etc.), adicione-as nas configurações do projeto e gere um novo deploy.'
  );
  root.render(
    <StrictMode>
      <ErrorScreen error={error} />
    </StrictMode>,
  );
} else {
  import('./App.tsx')
    .then(({ default: App }) => {
      root.render(
        <StrictMode>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </StrictMode>,
      );
    })
    .catch((err: Error) => {
      root.render(
        <StrictMode>
          <ErrorScreen error={err} />
        </StrictMode>,
      );
    });
}
