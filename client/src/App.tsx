import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './providers/ThemeProvider';
import { AuthProvider } from './providers/AuthContext';
import { MessageProvider } from './providers/MessageProvider';
import { AppRouter } from './Router/AppRouter';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MessageProvider>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </MessageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
