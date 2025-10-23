export function KanbanSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Mobile view skeleton */}
      <div className="md:hidden px-4 py-6">
        <div className="mb-6 text-center">
          <div className="h-6 bg-muted rounded w-32 mx-auto mb-3" />
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-1.5 w-1.5 bg-muted rounded-full" />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border rounded-lg p-4">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop view skeleton */}
      <div className="hidden md:grid md:grid-cols-4 gap-6 p-6">
        {[1, 2, 3, 4].map((col) => (
          <div key={col} className="space-y-4">
            <div className="h-8 bg-muted rounded w-24 mb-4" />
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-card border rounded-lg p-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
