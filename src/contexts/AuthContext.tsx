import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserInfoFromStorage, logout, getCurrentUser, getAuthToken, type UserInfo } from '../lib/api';

interface AuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: UserInfo) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log('🔍 AuthProvider render:', { user: user ? { id: user.id, username: user.username, permissions: user.permissions } : null, isLoading });

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Verificar se há token armazenado
        const token = getAuthToken();
        const storedUser = getUserInfoFromStorage();
        
        if (token && storedUser) {
          // ✅ Verificar se o token ainda é válido fazendo uma chamada ao backend
          try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
          } catch (error) {
            console.log('Token inválido, limpando dados de autenticação');
            logout();
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        // Se houver erro, limpar dados inválidos
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const handleLogin = (user: UserInfo) => {
    setUser(user);
  };

  const handleLogout = () => {
    logout(); // This clears localStorage and axios headers
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login: handleLogin,
    logout: handleLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
