import { useEffect } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { PROTECTED, useApp } from './context/AppContext';
import Layout from './components/Layout';
import Toaster from './components/Toaster';
import ErrorState from './components/ErrorState';
import { PageSkeleton } from './components/Skeleton';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import LiveWorkout from './pages/LiveWorkout';
import Progress from './pages/Progress';
import Classes from './pages/Classes';
import Profile from './pages/Profile';

const pages = {
  dashboard: Dashboard,
  library: Library,
  workout: LiveWorkout,
  progress: Progress,
  classes: Classes,
  profile: Profile,
};

const fullScreen = ['landing', 'login', 'signup'];

export default function App() {
  const { page, user, authReady, authError, refreshUser, requireLogin, navigate } = useApp();
  const needsLogin = PROTECTED.includes(page);
  const blocked = needsLogin && !user;

  // Logged-out visitors on a members-only page go to log in, then come back here
  useEffect(() => {
    if (blocked && authReady && !authError) requireLogin(page);
  }, [blocked, authReady, authError, page, requireLogin]);

  // Already logged in? Skip the login and sign-up screens
  useEffect(() => {
    if (user && (page === 'login' || page === 'signup')) navigate('dashboard', { replace: true });
  }, [user, page, navigate]);

  const Page = pages[page];
  const shellKey = fullScreen.includes(page) ? page : 'app';

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        <motion.div key={shellKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
          {page === 'landing' ? (
            <Landing />
          ) : page === 'login' || page === 'signup' ? (
            <Auth mode={page} />
          ) : (
            <Layout>
              <AnimatePresence mode="wait">
                <motion.div
                  key={page}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  {!blocked ? (
                    <Page />
                  ) : authError ? (
                    <ErrorState error={authError} onRetry={refreshUser} />
                  ) : (
                    <PageSkeleton />
                  )}
                </motion.div>
              </AnimatePresence>
            </Layout>
          )}
        </motion.div>
      </AnimatePresence>
      <Toaster />
    </MotionConfig>
  );
}
