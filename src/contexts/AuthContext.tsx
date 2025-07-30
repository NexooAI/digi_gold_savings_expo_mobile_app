import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

type AuthContextType = {
  user: null | { id: string; email: string; mobile: string };
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any, tokens: any) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async (userData: any, tokens: any) => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<null | { id: string; email: string }>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const checkAuth = async () => {
      try {
        const userData = await SecureStore.getItemAsync('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    // Implement your login logic here
    const dummyUser = { id: '1', email };
    await SecureStore.setItemAsync('user', JSON.stringify(dummyUser));
    setUser(dummyUser);
  };

  const register = async (userData: any, tokens: any) => {
    try {
      // Store user data and tokens securely
      const userInfo = {
        id: userData.id || '1',
        email: userData.email,
        mobile: userData.mobile_number
      };
      
      await SecureStore.setItemAsync('user', JSON.stringify(userInfo));
      await SecureStore.setItemAsync('accessToken', tokens.accessToken);
      await SecureStore.setItemAsync('token', tokens.token);
      await SecureStore.setItemAsync('refreshToken', tokens.refreshtoken);
      
      setUser(userInfo);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('user');
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('refreshToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);