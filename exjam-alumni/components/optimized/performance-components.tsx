"use client";

import React, { memo, useMemo, useCallback, useState, useRef, useEffect } from "react";
import {
  useVirtualizedList,
  useDebounce,
  useDebouncedCallback,
  useIntersectionObserver,
  useProgressiveImage,
  deepMemo,
  createMemoSelector,
} from "@/lib/performance-optimization";
import { useCachedQuery } from "@/lib/advanced-caching";
import { LoadingSpinner, SkeletonCard } from "@/components/ui/enhanced-loading";

// Optimized image component with lazy loading and progressive enhancement
export const OptimizedImage = memo<{
  src: string;
  alt: string;
  lowQualitySrc?: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}>(({ src, alt, lowQualitySrc, width, height, className, priority = false, onLoad, onError }) => {
  const [ref, entry] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: "50px",
  });

  const { src: progressiveSrc, loading } = useProgressiveImage(lowQualitySrc || src, src);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const shouldLoad = priority || entry?.isIntersecting;

  const handleLoad = useCallback(() => {
    setImageLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setImageError(true);
    onError?.();
  }, [onError]);

  if (imageError) {
    return (
      <div
        ref={ref}
        className={`flex items-center justify-center bg-gray-200 ${className}`}
        style={{ width, height }}
      >
        <svg
          className="h-8 w-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {shouldLoad && (
        <img
          src={progressiveSrc}
          alt={alt}
          width={width}
          height={height}
          className={`transition-opacity duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          } ${loading ? "blur-sm" : ""}`}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? "eager" : "lazy"}
        />
      )}

      {(!shouldLoad || !imageLoaded) && (
        <div className="absolute inset-0 animate-pulse bg-gray-200" style={{ width, height }} />
      )}
    </div>
  );
});

OptimizedImage.displayName = "OptimizedImage";

// Virtualized list component for large datasets
export const VirtualizedList = memo<{
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  className?: string;
  onScroll?: (scrollTop: number) => void;
}>(({ items, itemHeight, containerHeight, renderItem, className, onScroll }) => {
  const {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: handleScroll,
  } = useVirtualizedList(items, itemHeight, containerHeight);

  const handleScrollChange = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      handleScroll(e);
      onScroll?.(e.currentTarget.scrollTop);
    },
    [handleScroll, onScroll]
  );

  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScrollChange}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={index} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

VirtualizedList.displayName = "VirtualizedList";

// Optimized search component with debouncing
export const OptimizedSearch = memo<{
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  disabled?: boolean;
}>(({ onSearch, placeholder = "Search...", debounceMs = 300, className, disabled }) => {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, debounceMs);

  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {query && (
        <button
          onClick={() => setQuery("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
});

OptimizedSearch.displayName = "OptimizedSearch";

// Cached data fetching component
export const CachedDataList = memo<{
  endpoint: string;
  renderItem: (item: any) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  renderError?: (error: Error) => React.ReactNode;
  className?: string;
  cacheKey?: string;
  tags?: string[];
}>(({ endpoint, renderItem, renderEmpty, renderError, className, cacheKey, tags = [] }) => {
  const fetchData = useCallback(async () => {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }, [endpoint]);

  const { data, isLoading, error, refetch } = useCachedQuery(cacheKey || endpoint, fetchData, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    tags: [endpoint, ...tags],
    background: true,
  });

  if (error) {
    return renderError ? (
      renderError(error as Error)
    ) : (
      <div className={`py-8 text-center ${className}`}>
        <p className="text-red-600">Failed to load data</p>
        <button
          onClick={() => refetch()}
          className="mt-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} lines={3} />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return renderEmpty ? (
      renderEmpty()
    ) : (
      <div className={`py-8 text-center text-gray-500 ${className}`}>No data available</div>
    );
  }

  return (
    <div className={className}>
      {data.map((item: any, index: number) => (
        <div key={item.id || index}>{renderItem(item)}</div>
      ))}
    </div>
  );
});

CachedDataList.displayName = "CachedDataList";

// Optimized table with sorting and filtering
interface TableColumn<T> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string;
}

export const OptimizedTable = memo(
  <T extends Record<string, any>>({
    data,
    columns,
    className,
    onSort,
    sortKey,
    sortDirection,
    loading = false,
    pageSize = 50,
  }: {
    data: T[];
    columns: TableColumn<T>[];
    className?: string;
    onSort?: (key: keyof T, direction: "asc" | "desc") => void;
    sortKey?: keyof T;
    sortDirection?: "asc" | "desc";
    loading?: boolean;
    pageSize?: number;
  }) => {
    const [page, setPage] = useState(0);

    const paginatedData = useMemo(() => {
      const start = page * pageSize;
      const end = start + pageSize;
      return data.slice(start, end);
    }, [data, page, pageSize]);

    const totalPages = Math.ceil(data.length / pageSize);

    const handleSort = useCallback(
      (key: keyof T) => {
        if (!onSort) return;

        const newDirection = sortKey === key && sortDirection === "asc" ? "desc" : "asc";
        onSort(key, newDirection);
      },
      [onSort, sortKey, sortDirection]
    );

    const SortIcon = memo<{ column: keyof T }>(({ column }) => {
      if (sortKey !== column) {
        return (
          <svg
            className="h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
            />
          </svg>
        );
      }

      return sortDirection === "asc" ? (
        <svg
          className="h-4 w-4 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
          />
        </svg>
      ) : (
        <svg
          className="h-4 w-4 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
          />
        </svg>
      );
    });

    if (loading) {
      return (
        <div className={className}>
          <div className="animate-pulse space-y-4">
            <div className="h-12 rounded bg-gray-200" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded bg-gray-100" />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className={className}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 ${
                      column.sortable ? "cursor-pointer hover:bg-gray-100" : ""
                    }`}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.title}</span>
                      {column.sortable && <SortIcon column={column.key} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {paginatedData.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className="whitespace-nowrap px-6 py-4 text-sm text-gray-900"
                    >
                      {column.render
                        ? column.render(item[column.key], item)
                        : String(item[column.key] || "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, data.length)} of{" "}
              {data.length} entries
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="rounded border px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <span className="px-3 py-2 text-sm">
                Page {page + 1} of {totalPages}
              </span>

              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="rounded border px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

OptimizedTable.displayName = "OptimizedTable";

// Infinite scroll component
export const InfiniteScrollList = memo<{
  hasMore: boolean;
  loadMore: () => Promise<void>;
  loading: boolean;
  children: React.ReactNode;
  className?: string;
  threshold?: number;
}>(({ hasMore, loadMore, loading, children, className, threshold = 0.8 }) => {
  const [sentinelRef, entry] = useIntersectionObserver({
    threshold,
  });

  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  useEffect(() => {
    if (entry?.isIntersecting && hasMore && !loading) {
      loadMoreRef.current();
    }
  }, [entry?.isIntersecting, hasMore, loading]);

  return (
    <div className={className}>
      {children}

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {loading ? (
            <LoadingSpinner size="md" />
          ) : (
            <button
              onClick={() => loadMore()}
              className="px-4 py-2 text-blue-600 hover:text-blue-800"
            >
              Load More
            </button>
          )}
        </div>
      )}

      {!hasMore && <div className="py-8 text-center text-gray-500">No more items to load</div>}
    </div>
  );
});

InfiniteScrollList.displayName = "InfiniteScrollList";
