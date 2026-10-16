import { motion } from 'framer-motion';
import { navItems } from './nav';
import { useApp } from '../context/AppContext';

// Profile lives in the mobile top bar, so the bottom bar keeps five thumb-friendly targets
const items = navItems.filter((n) => n.key !== 'profile');

export default function BottomNav() {
  const { page, navigate } = useApp();
  return (
    <nav
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line/[0.08] bg-surface/80 backdrop-blur-xl lg:hidden"
      aria-label="Main"
    >
      <ul className="mx-auto flex max-w-md items-end justify-around px-2 pt-2">
        {items.map(({ key, short, Icon, featured }) => {
          const active = page === key;
          if (featured) {
            return (
              <li key={key} className="-mt-7">
                <button
                  onClick={() => navigate(key)}
                  className="flex flex-col items-center gap-1"
                  aria-current={active ? 'page' : undefined}
                  aria-label="Live workout"
                >
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient text-[#0B0F14] shadow-glow ring-4 ring-bg transition active:scale-95">
                    <Icon className="h-6 w-6" strokeWidth={2.4} />
                  </span>
                  <span className={`pb-2 text-[11px] font-semibold ${active ? 'text-accent' : 'text-muted'}`}>{short}</span>
                </button>
              </li>
            );
          }
          return (
            <li key={key}>
              <button
                onClick={() => navigate(key)}
                className={`relative flex w-16 flex-col items-center gap-1 pb-2 pt-1 ${active ? 'text-accent' : 'text-muted'}`}
                aria-current={active ? 'page' : undefined}
              >
                {active && (
                  <motion.span
                    layoutId="bottom-active"
                    className="absolute -top-2 h-1 w-8 rounded-full bg-brand-gradient shadow-glow"
                  />
                )}
                <Icon className="h-[22px] w-[22px]" />
                <span className="text-[11px] font-semibold">{short}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
