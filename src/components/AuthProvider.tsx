import { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  email: string;
  canEdit: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  changePassword: (newPassword: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const ADMIN_EMAIL = 'andresfelipeuribe11@gmail.com';
let ADMIN_PASSWORD = '123456789';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string): boolean => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setUser({ email, canEdit: true });
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const changePassword = (newPassword: string): boolean => {
    if (user?.email === ADMIN_EMAIL && newPassword.length >= 6) {
      ADMIN_PASSWORD = newPassword;
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};