"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  label: string;
  children: ReactNode;
};

type State = {
  error: Error | null;
};

/** Captura crashes de render en paneles admin (evita pantalla blanca silenciosa). */
export class AdminPanelErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[AdminPanelErrorBoundary:${this.props.label}]`, error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900">
          <p className="font-medium">Error en {this.props.label}</p>
          <p className="mt-2 text-xs font-mono whitespace-pre-wrap break-all">{this.state.error.message}</p>
          <button
            type="button"
            className="mt-3 rounded-full border border-red-300 bg-white px-3 py-1.5 text-xs font-medium"
            onClick={() => this.setState({ error: null })}
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
