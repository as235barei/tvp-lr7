import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, clearToken, getToken, setToken } from '../api/client';

// Реальна автентифікація (ЛР №4): звертається до бекенду Express + MySQL.
// JWT зберігається у localStorage (ключ techshop_token). При старті застосунку
// токен перевіряється запитом GET /api/auth/me — так зберігається сесія між
// перезавантаженнями сторінки.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Відновлення сесії за збереженим токеном.
  useEffect(() => {
    let cancelled = false;
    async function restore() {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { user: me } = await authApi.me();
        if (!cancelled) setUser(me);
      } catch {
        clearToken(); // токен недійсний/прострочений
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  // Реєстрація → зберігає токен і користувача.
  const register = useCallback(async ({ name, email, password }) => {
    const { token, user: created } = await authApi.register({ name, email, password });
    setToken(token);
    setUser(created);
    return created;
  }, []);

  // Вхід → зберігає токен і користувача.
  const login = useCallback(async ({ email, password }) => {
    const { token, user: signed } = await authApi.login({ email, password });
    setToken(token);
    setUser(signed);
    return signed;
  }, []);

  // Вихід → видаляє токен на клієнті (та повідомляє сервер).
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* для Bearer-токена достатньо видалити токен на клієнті */
    }
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        loading,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
