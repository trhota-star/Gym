// Glass-style loading placeholders with a soft neon sweep

export function Skeleton({ className = '', ...rest }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" {...rest} />;
}

export function SkeletonCard({ className = '', children }) {
  return (
    <div className={`glass relative overflow-hidden p-5 sm:p-6 ${className}`} aria-hidden="true">
      {children}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading">
      <Skeleton className="mb-3 h-3 w-28" />
      <Skeleton className="mb-8 h-10 w-72 max-w-full" />
      <div className="grid gap-4 lg:grid-cols-3">
        <SkeletonCard className="h-64 lg:col-span-2" />
        <SkeletonCard className="h-64" />
      </div>
    </div>
  );
}
