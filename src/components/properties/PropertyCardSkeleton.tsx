import { Skeleton } from '@/components/ui/skeleton'

export function PropertyCardSkeleton() {
  return (
    <div className="bg-sand-100 rounded-lg overflow-hidden border border-earth/5 shadow-card">
      <Skeleton className="aspect-[16/10] w-full bg-sand-300" />
      <div className="p-5 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4 bg-sand-300" />
          <Skeleton className="h-3 w-1/2 bg-sand-300" />
        </div>
        <div className="grid grid-cols-2 gap-3 pb-4 border-b border-earth/8">
          <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-16 bg-sand-300" />
            <Skeleton className="h-4 w-20 bg-sand-300" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-16 bg-sand-300" />
            <Skeleton className="h-4 w-20 bg-sand-300" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-2.5 w-20 bg-sand-300" />
          <Skeleton className="h-2 w-full bg-sand-300" />
        </div>
      </div>
    </div>
  )
}
