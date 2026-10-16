import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import Footer from './Footer';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import { LogIn, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { initials } from '../lib/api';

export default function Layout({ children }) {
  const { navigate, user, logout } = useApp();
  return (
    <div className="relative min-h-screen">
      <Backdrop />
      <Sidebar />

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line/[0.07] bg-bg/70 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Logo onClick={() => navigate('landing')} />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <button
                onClick={() => navigate('profile')}
                className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 font-display text-sm font-bold text-white"
                aria-label={`Open profile for ${user.fullName}`}
                title={user.fullName}
              >
                {initials(user.fullName)}
              </button>
              <button
                onClick={logout}
                className="grid h-10 w-10 place-items-center rounded-xl border border-line/10 bg-line/[0.03] text-muted transition hover:border-line/25 hover:text-ink"
                aria-label="Log out"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </>
          ) : (
            <button onClick={() => navigate('login')} className="btn-primary !px-4 !py-2.5 text-sm">
              <LogIn className="h-4 w-4" /> Log in
            </button>
          )}
        </div>
      </header>

      <main className="relative px-4 pb-32 pt-6 sm:px-6 lg:ml-72 lg:px-10 lg:pb-10 lg:pt-10">
        <div className="mx-auto max-w-6xl">
          {children}
          <Footer compact />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

export function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-lime-400/[0.12] blur-[120px] animate-pulseglow" />
      <div className="absolute -right-40 top-1/3 h-[30rem] w-[30rem] rounded-full bg-cyan-400/[0.10] blur-[120px] animate-pulseglow [animation-delay:1.5s]" />
      <div className="absolute bottom-0 left-1/3 h-[22rem] w-[22rem] rounded-full bg-violet-500/[0.08] blur-[120px]" />
    </div>
  );
}
