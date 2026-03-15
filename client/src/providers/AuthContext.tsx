import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContextData } from '../entities/AuthContextData';
import { User } from '../entities/User';
import { userService } from '../api/userService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  contexts: AuthContextData[];
  currentContext: AuthContextData | null;
  login: (token: string, contexts: AuthContextData[], needsProfileCompletion: boolean) => void;
  setContext: (context: AuthContextData, token: string) => void;
  logout: () => void;
  isLoading: boolean;
  needsProfileCompletion: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [contexts, setContexts] = useState<AuthContextData[]>([]);
  const [currentContext, setCurrentContext] = useState<AuthContextData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const userData = await userService.getMe();
          setUser(userData);
          setIsAuthenticated(true);
          
          // Load contexts from local storage if available
          const savedContexts = localStorage.getItem('contexts');
          if (savedContexts) {
            setContexts(JSON.parse(savedContexts));
          }
          
          const savedCurrentContext = localStorage.getItem('currentContext');
          if (savedCurrentContext) {
            setCurrentContext(JSON.parse(savedCurrentContext));
          }

        } catch (error) {
          console.error('Failed to fetch user', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = (token: string, newContexts: AuthContextData[], profileCompletionNeeded: boolean) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('contexts', JSON.stringify(newContexts));
    setContexts(newContexts);
    setNeedsProfileCompletion(profileCompletionNeeded);
    setIsAuthenticated(true);
    
    // Fetch user details
    userService.getMe().then(setUser).catch(console.error);
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
        setContext,
        logout,
        isLoading,
        needsProfileCompletion
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
