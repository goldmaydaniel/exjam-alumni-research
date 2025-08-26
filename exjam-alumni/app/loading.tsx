import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingAnnouncement } from "@/components/ui/accessibility";

export default function Loading() {
  return (
    <>
      <LoadingAnnouncement isLoading={true} loadingText="Loading page content, please wait..." />

      <div className="container py-8">
        {/* Hero section skeleton */}
        <div className="mb-8 text-center">
          <Skeleton className="mx-auto mb-4 h-12 w-64" />
          <Skeleton className="mx-auto mb-6 h-6 w-96" />
          <div className="flex justify-center gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-lg border">
              <Skeleton className="aspect-video w-full rounded-t-lg" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-9 flex-1" />
                  <Skeleton className="h-9 flex-1" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Central loading indicator */}
        <div className="mt-12 text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading content...</p>
        </div>
      </div>
    </>
  );
}
