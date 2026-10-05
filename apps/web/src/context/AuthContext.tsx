import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { dataSource, type AuthUser, type ProfileUpdateInput, type SignUpInput } from '../services/index.js';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (input: SignUpInput) => Promise<AuthUser | null>;
  doLogout: () => Promise<void>;
  updateProfile: (input: ProfileUpdateInput) => Promise<AuthUser>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataSource
      .getSession()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  async function signIn(email: string, password: string) {
    const loggedUser = await dataSource.signIn(email, password);
    setUser(loggedUser);
    return loggedUser;
  }

  async function signUp(input: SignUpInput) {
    const created = await dataSource.signUp(input);
    if (created) setUser(created);
    return created;
  }

  async function doLogout() {
    await dataSource.signOut();
    setUser(null);
  }

  async function updateProfile(input: ProfileUpdateInput) {
    if (!user) throw new Error('Sessão inválida');
    const updated = await dataSource.updateProfile(user.id, input);
    setUser(updated);
    return updated;
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, doLogout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
