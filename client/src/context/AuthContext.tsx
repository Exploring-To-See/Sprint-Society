import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'runner';
  gender?: string;
  age?: number;
  height_cm?: number;
  weight_kg?: number;
  fitness_level?: string;
  running_experience?: string;
  profile_image_url?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  googleLogin: (credential: string) => Promise<{ isNew?: boolean }>;
  /** Apply a JWT received from the native deep-link auth bridge. */
  acceptToken: (token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('sprint_society_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.get('/auth/me', { timeout: 10000 })
        .then(res => setUser(res.data))
        .catch(() => { localStorage.removeItem('sprint_society_token'); setToken(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const handleSessionExpired = () => { setToken(null); setUser(null); };
    window.addEventListener('sprint:session-expired', handleSessionExpired);
    return () => window.removeEventListener('sprint:session-expired', handleSessionExpired);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('sprint_society_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const register = async (data: any) => {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('sprint_society_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const googleLogin = async (credential: string): Promise<{ isNew?: boolean }> => {
    const res = await api.post('/auth/google', { credential });
    localStorage.setItem('sprint_society_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return { isNew: res.data.isNew };
  };

  const acceptToken = (jwt: string) => {
    localStorage.setItem('sprint_society_token', jwt);
    setToken(jwt);
    // /auth/me effect will hydrate `user` from the new token
  };

  const logout = () => {
    localStorage.removeItem('sprint_society_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, googleLogin, acceptToken, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
