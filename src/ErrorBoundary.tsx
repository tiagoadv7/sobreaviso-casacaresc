import React from 'react';
import { ErrorScreen } from './ErrorScreen';

interface ErrorBoundaryState {
  error: Error | null;
}

// Sem isso, qualquer erro não tratado durante a renderização derruba a
// árvore de componentes inteira e deixa a tela em branco, sem nenhuma
// pista do que houve.
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Erro não tratado na aplicação:', error, info.componentStack);
  }

  render() {
    if (this.state.error) return <ErrorScreen error={this.state.error} />;
    return this.props.children;
  }
}
