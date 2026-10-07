import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Icon } from './Icon.js';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** Evita a tela em branco: um erro de render/efeito vira uma mensagem, e o resto do layout (tab bar) segue vivo. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <div className="empty">
        <Icon name="alert" />
        <p>Não foi possível carregar esta tela.</p>
        <p className="small muted">{this.state.error.message}</p>
      </div>
    );
  }
}
