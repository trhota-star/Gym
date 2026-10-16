import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';

const AppContext = createContext(null);

export const PAGES = ['landing', 'login', 'signup', 'dashboard', 'library', 'workout', 'progress', 'classes', 'profile'];
export const PROTECTED = ['dashboard', 'library', 'workout'];

const pageFromHash = () => {
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  return PAGES.includes(hash) ? hash : 'landing';
};

const readTheme = () => {
  try {
    return localStorage.getItem('pulsefit-theme') || 'dark';
  } catch {
    return 'dark';
  }
};

let toastId = 0;

export function AppProvider({ children }) {
  const [page, setPage] = useState(pageFromHash);
  const [theme, setTheme] = useState(readTheme);
  const [toasts, setToasts] = useState([]);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState(null);
  const afterLogin = useRef(null);

  // Hash-based routing keeps refresh and the back button working without a router
  useEffect(() => {
    const onHash = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#07090D' : '#F4F7F2');
    try {
      localStorage.setItem('pulsefit-theme', theme);
    } catch {
      /* storage unavailable: theme still applies for this session */
    }
  }, [theme]);

  const navigate = useCallback((next, { replace = false } = {}) => {
    if (replace) window.location.replace(`#/${next}`);
    else window.location.hash = `/${next}`;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    ({ title, message, type = 'success', duration = 3800 }) => {
      const id = ++toastId;
      setToasts((t) => [...t.slice(-2), { id, title, message, type }]);
      setTimeout(() => dismissToast(id), duration);
    },
    [dismissToast]
  );

  // ---- Auth -------------------------------------------------------------
  const refreshUser = useCallback(async () => {
    try {
      const { user: me } = await api('/api/auth/me');
      setUser(me);
      setAuthError(null);
      return me;
    } catch (err) {
      setAuthError(err);
      return null;
    } finally {
      setAuthReady(true);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Any API call that comes back 401 means the session expired
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener('pulsefit:unauthorized', onUnauthorized);
    return () => window.removeEventListener('pulsefit:unauthorized', onUnauthorized);
  }, []);

  const finishAuth = useCallback(
    (me) => {
      setUser(me);
      setAuthError(null);
      const next = afterLogin.current ?? 'dashboard';
      afterLogin.current = null;
      navigate(next, { replace: true });
    },
    [navigate]
  );

  const login = useCallback(async (email, password) => {
    const { user: me } = await api('/api/auth/login', { method: 'POST', body: { email, password } });
    finishAuth(me);
    return me;
  }, [finishAuth]);

  const signup = useCallback(async (details) => {
    const { user: me } = await api('/api/auth/signup', { method: 'POST', body: details });
    finishAuth(me);
    return me;
  }, [finishAuth]);

  const logout = useCallback(async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      navigate('landing');
      toast({ type: 'info', title: 'Logged out', message: 'See you at your next session 👋' });
    }
  }, [navigate, toast]);

  /** Send logged-out visitors to log in, then bring them back to `target` afterwards. */
  const requireLogin = useCallback(
    (target) => {
      afterLogin.current = target;
      navigate('login', { replace: true });
    },
    [navigate]
  );

  const value = useMemo(
    () => ({
      page,
      navigate,
      theme,
      toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
      toasts,
      toast,
      dismissToast,
      user,
      authReady,
      authError,
      refreshUser,
      login,
      signup,
      logout,
      requireLogin,
    }),
    [page, navigate, theme, toasts, toast, dismissToast, user, authReady, authError, refreshUser, login, signup, logout, requireLogin]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
