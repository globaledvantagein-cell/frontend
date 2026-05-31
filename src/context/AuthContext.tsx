import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiPost } from '../utils/jobApi';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatarUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  loginWithGoogle: (credential: string, acceptedTerms: boolean, extraBody?: Record<string, unknown>) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Prefixed keys prevent collisions when multiple projects share localhost
const STORAGE_KEY_TOKEN = 'ejg_token';
const STORAGE_KEY_USER = 'ejg_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    const storedUser = localStorage.getItem(STORAGE_KEY_USER);

    // Migrate old unprefixed keys (one-time, seamless for existing users)
    if (!storedToken && !storedUser) {
      const oldToken = localStorage.getItem('token');
      const oldUser = localStorage.getItem('user');
      if (oldToken && oldUser) {
        localStorage.setItem(STORAGE_KEY_TOKEN, oldToken);
        localStorage.setItem(STORAGE_KEY_USER, oldUser);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(oldToken);
        setUser(JSON.parse(oldUser));
        setIsLoading(false);
        return;
      }
    }

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem(STORAGE_KEY_TOKEN, newToken);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const loginWithGoogle = async (credential: string, acceptedTerms: boolean, extraBody: Record<string, unknown> = {}) => {
    const res = await apiPost<{ token: string; user: User }>('/api/auth/google', {
      credential,
      acceptedTerms,
      ...extraBody,
    });
    login(res.token, res.user);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, login, loginWithGoogle, logout, isAuthenticated, isAdmin, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
