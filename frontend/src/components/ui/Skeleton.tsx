export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="glass rounded-2xl p-5 space-y-3">
      <Skeleton className="h-10 w-10 rounded-xl" />
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

export function LessonCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-5 flex items-center gap-4">
      <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="w-16 h-5 shrink-0" />
    </div>
  );
}

export function ChatMessageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Skeleton className="h-12 w-48 rounded-2xl" />
      </div>
      <div className="flex justify-start">
        <Skeleton className="h-16 w-64 rounded-2xl" />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-5 w-96" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  );
}
