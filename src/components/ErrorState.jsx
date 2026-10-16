import { AlertTriangle, DatabaseZap, RotateCcw, WifiOff } from 'lucide-react';
import EmptyState from './EmptyState';

const copy = {
  DB_UNAVAILABLE: { icon: DatabaseZap, title: 'Can’t reach the database' },
  NETWORK: { icon: WifiOff, title: 'Can’t reach the server' },
};

export default function ErrorState({ error, onRetry }) {
  const { icon, title } = copy[error?.code] ?? { icon: AlertTriangle, title: 'Something went wrong' };
  return (
    <EmptyState
      icon={icon}
      title={title}
      message={error?.message ?? 'Please try again in a moment.'}
      action={
        onRetry && (
          <button className="btn-primary" onClick={onRetry}>
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
        )
      }
    />
  );
}
