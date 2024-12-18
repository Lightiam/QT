import { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { QuantumError } from '../../lib/errors';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private getErrorMessage(error: Error): string {
    if (error instanceof QuantumError) {
      return `Quantum Error (${error.type}): ${error.message}`;
    }
    return error.message || 'An unexpected error occurred';
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive" className="m-4">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            {this.state.error && this.getErrorMessage(this.state.error)}
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}
