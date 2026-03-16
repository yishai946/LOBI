import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthContextData } from '../entities/AuthContextData';
import { User } from '../entities/User';
import { userService } from '../api/userService';
import { useGlobalMessage } from './MessageProvider';

const authQueryKeys = {
  me: ['auth', 'me'] as const,
};

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  contexts: AuthContextData[];
  currentContext: AuthContextData | null;
  login: (token: string, contexts: AuthContextData[], needsProfileCompletion: boolean) => void;
  completeProfile: (user: User) => void;
  setContext: (context: AuthContextData, token: string) => void;
  logout: () => void;
  isLoading: boolean;
  needsProfileCompletion: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useGlobalMessage();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [contexts, setContexts] = useState<AuthContextData[]>(() => {
    const savedContexts = localStorage.getItem('contexts');
    return savedContexts ? JSON.parse(savedContexts) : [];
  });
  const [currentContext, setCurrentContext] = useState<AuthContextData | null>(() => {
    const savedCurrentContext = localStorage.getItem('currentContext');
    return savedCurrentContext ? JSON.parse(savedCurrentContext) : null;
  });
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState<boolean>(() => {
    return localStorage.getItem('needsProfileCompletion') === 'true';
  });
  const token = localStorage.getItem('accessToken');
  const meQuery = useQuery({
    queryKey: authQueryKeys.me,
    queryFn: userService.getMe,
    enabled: Boolean(token),
    retry: false,
  });
  const isLoading = meQuery.isLoading;

  useEffect(() => {
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      return;
    }

    if (meQuery.isSuccess) {
      setUser(meQuery.data);
      setIsAuthenticated(true);
      if (!isAuthenticated) {
        showSuccess('ברוך הבא');
      }
    }
  }, [token, meQuery.isSuccess, meQuery.data, isAuthenticated, showSuccess]);

  useEffect(() => {
    if (token && meQuery.isError) {
      showError('פג תוקף ההתחברות. אנא התחבר מחדש');
      logout();
    }
  }, [token, meQuery.isError, showError]);

  const login = (
    token: string,
    newContexts: AuthContextData[],
    profileCompletionNeeded: boolean
  ) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('contexts', JSON.stringify(newContexts));
    localStorage.setItem('needsProfileCompletion', String(profileCompletionNeeded));
    localStorage.removeItem('currentContext');
    setContexts(newContexts);
    setCurrentContext(null);
    setNeedsProfileCompletion(profileCompletionNeeded);
    setIsAuthenticated(true);

    queryClient
      .fetchQuery({
        queryKey: authQueryKeys.me,
        queryFn: userService.getMe,
      })
      .then(setUser)
      .catch(() => {
        logout();
      });
  };

  const completeProfile = (nextUser: User) => {
    setUser(nextUser);
    setNeedsProfileCompletion(false);
    localStorage.removeItem('needsProfileCompletion');
    queryClient.setQueryData(authQueryKeys.me, nextUser);
  };

  const setContext = (context: AuthContextData, token: string) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('currentContext', JSON.stringify(context));
    setCurrentContext(context);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('contexts');
    localStorage.removeItem('currentContext');
    localStorage.removeItem('needsProfileCompletion');
    queryClient.removeQueries({ queryKey: authQueryKeys.me });
    setIsAuthenticated(false);
    setUser(null);
    setContexts([]);
    setCurrentContext(null);
    setNeedsProfileCompletion(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        contexts,
        currentContext,
        login,
        completeProfile,
        setContext,
        logout,
        isLoading,
        needsProfileCompletion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
