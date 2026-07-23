import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Fängt Render-Crashes ab und zeigt einen Fallback statt eines weißen Bildschirms.
 * Bewusst ohne externe Telemetrie (siehe AGENTS.md §7).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Für Entwicklung: Fehler in die Konsole loggen. Kein externer Dienst.
    console.error('Unerwarteter Fehler:', error, info.componentStack);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="text-2xl font-bold text-danger">Something went wrong</h1>
          <p className="text-text-muted">
            The game ran into an unexpected error. Try reloading the page.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="rounded-md bg-accent px-4 py-2 font-medium text-background hover:bg-accent-strong"
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
