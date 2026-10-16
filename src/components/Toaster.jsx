import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const styles = {
  success: { Icon: CheckCircle2, ring: 'from-lime-400 to-cyan-400', icon: 'text-accent' },
  error: { Icon: AlertTriangle, ring: 'from-rose-500 to-orange-400', icon: 'text-rose-500' },
  info: { Icon: Info, ring: 'from-cyan-400 to-violet-500', icon: 'text-cyan-500' },
};

export default function Toaster() {
  const { toasts, dismissToast } = useApp();
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:left-auto lg:right-6 lg:top-auto lg:items-end"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const { Icon, ring, icon } = styles[t.type] ?? styles.info;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="glass pointer-events-auto relative flex w-full max-w-sm items-start gap-3 !rounded-2xl p-4 pr-10"
              role="status"
            >
              <span className={`absolute inset-y-3 left-0 w-1 rounded-r-full bg-gradient-to-b ${ring}`} />
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${icon}`} />
              <div className="min-w-0">
                <p className="font-display font-semibold">{t.title}</p>
                {t.message && <p className="mt-0.5 text-sm text-muted">{t.message}</p>}
              </div>
              <button
                onClick={() => dismissToast(t.id)}
                className="absolute right-3 top-3 rounded-lg p-1 text-muted transition hover:bg-line/10 hover:text-ink"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
