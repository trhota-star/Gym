import { Heart } from 'lucide-react';
import Logo from './Logo';
import { useApp } from '../context/AppContext';

export default function Footer({ compact = false }) {
  const { navigate } = useApp();
  return (
    <footer className={`border-t border-line/[0.07] ${compact ? 'mt-12 py-6' : 'py-10'}`}>
      <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted sm:flex-row">
        <Logo onClick={() => navigate('landing')} />
        <p className="text-center sm:text-right">
          © 2026 PulseFit · Built with{' '}
          <Heart className="inline h-3.5 w-3.5 -translate-y-px fill-rose-500 text-rose-500" aria-label="love" /> for people who show up.
        </p>
      </div>
    </footer>
  );
}
