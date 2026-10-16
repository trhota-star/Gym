import { motion } from 'framer-motion';
import { Flame, LogIn, LogOut } from 'lucide-react';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import { navItems } from './nav';
import { useApp } from '../context/AppContext';
import { initials } from '../lib/api';

export default function Sidebar() {
  const { page, navigate, user, logout } = useApp();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-line/[0.07] bg-surface/40 p-6 backdrop-blur-xl lg:flex">
      <Logo onClick={() => navigate('landing')} />

      <nav className="mt-10 flex flex-col gap-1.5" aria-label="Main">
        {navItems.map(({ key, label, Icon }) => {
          const active = page === key;
          return (
            <button
              key={key}
              onClick={() => navigate(key)}
              className={`relative flex items-center gap-3 rounded-2xl px-4 py-3 text-left font-medium transition-colors ${
                active ? 'text-[#0B0F14]' : 'text-muted hover:bg-line/[0.05] hover:text-ink'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-2xl bg-brand-gradient shadow-glow"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className="relative h-5 w-5" />
              <span className="relative">{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4">
        {user && (
          <div className="glass !rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500/15">
                <Flame className="h-5 w-5 fill-orange-500 text-orange-500" />
              </span>
              <div>
                <p className="font-display text-lg font-bold leading-none">
                  {user.streak}-day streak
                </p>
                <p className="mt-1 text-xs text-muted">
                  {user.streak ? 'Train today to keep it alive' : 'Finish a workout to start one'}
                </p>
              </div>
            </div>
          </div>
        )}
        {user ? (
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => navigate('profile')}
              className="flex min-w-0 items-center gap-3 rounded-xl p-1 pr-3 transition hover:bg-line/[0.05]"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 font-display font-bold text-white">
                {initials(user.fullName)}
              </span>
              <span className="min-w-0 text-left">
                <span className="block truncate text-sm font-semibold">{user.fullName}</span>
                <span className="block truncate text-xs text-accent">{user.email}</span>
              </span>
            </button>
            <div className="flex shrink-0 gap-1.5">
              <ThemeToggle />
              <button
                onClick={logout}
                className="grid h-10 w-10 place-items-center rounded-xl border border-line/10 bg-line/[0.03] text-muted transition hover:border-line/25 hover:bg-line/[0.07] hover:text-ink"
                aria-label="Log out"
                title="Log out"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <button onClick={() => navigate('login')} className="btn-primary flex-1">
              <LogIn className="h-4 w-4" /> Log in
            </button>
            <ThemeToggle />
          </div>
        )}
      </div>
    </aside>
  );
}
