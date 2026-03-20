import { Button, Stack, Typography } from '@mui/material';
import { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: unknown): void {
    console.error('Unhandled UI error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={2}
          sx={{ minHeight: '100vh', px: 3, textAlign: 'center' }}
        >
          <Typography variant="h5" fontWeight={700}>
            משהו השתבש
          </Typography>
          <Typography variant="body1" color="text.secondary">
            אירעה שגיאה בלתי צפויה במסך. אפשר לנסות לרענן את הדף.
          </Typography>
          <Button variant="contained" onClick={this.handleReload}>
            רענון הדף
          </Button>
        </Stack>
      );
    }

    return this.props.children;
  }
}
