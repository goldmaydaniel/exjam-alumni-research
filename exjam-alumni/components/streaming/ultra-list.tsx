"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FixedSizeList, VariableSizeList } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import * as Comlink from "comlink";

// Web Worker for background data processing
const createDataWorker = () => {
  if (typeof window === "undefined") return null;

  const workerCode = `
    self.addEventListener('message', function(e) {
      const { type, data, options } = e.data;
      
      switch(type) {
        case 'PROCESS_CHUNK':
          const processed = processDataChunk(data, options);
          self.postMessage({ type: 'CHUNK_PROCESSED', data: processed });
          break;
        case 'SEARCH_FILTER':
          const filtered = filterData(data, options.query);
          self.postMessage({ type: 'SEARCH_RESULTS', data: filtered });
          break;
      }
    });
    
    function processDataChunk(chunk, options) {
      return chunk.map(item => ({
        ...item,
        _processed: true,
        _timestamp: Date.now()
      }));
    }
    
    function filterData(data, query) {
      const lowQuery = query.toLowerCase();
      return data.filter(item => 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(lowQuery)
        )
      );
    }
  `;

  const blob = new Blob([workerCode], { type: "application/javascript" });
  return new Worker(URL.createObjectURL(blob));
};

interface UltraListProps<T> {
  items: T[];
  height: number;
  itemHeight: number | ((index: number) => number);
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  loadMore?: () => Promise<T[]>;
  hasMore?: boolean;
  isLoading?: boolean;
  searchQuery?: string;
  className?: string;
  overscan?: number;
  enableVirtualization?: boolean;
  enableWebWorker?: boolean;
  enablePredictiveLoading?: boolean;
}

export function UltraList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  loadMore,
  hasMore = false,
  isLoading = false,
  searchQuery = "",
  className = "",
  overscan = 10,
  enableVirtualization = true,
  enableWebWorker = true,
  enablePredictiveLoading = true,
}: UltraListProps<T>) {
  const [processedItems, setProcessedItems] = useState<T[]>(items);
  const [filteredItems, setFilteredItems] = useState<T[]>(items);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("down");
  const listRef = useRef<FixedSizeList | VariableSizeList>(null);
  const lastScrollTop = useRef(0);

  // Initialize Web Worker
  useEffect(() => {
    if (enableWebWorker && typeof window !== "undefined") {
      const dataWorker = createDataWorker();
      if (dataWorker) {
        setWorker(dataWorker);

        dataWorker.onmessage = (e) => {
          const { type, data } = e.data;
          switch (type) {
            case "CHUNK_PROCESSED":
              setProcessedItems((prevItems) => [...prevItems, ...data]);
              break;
            case "SEARCH_RESULTS":
              setFilteredItems(data);
              break;
          }
        };

        return () => {
          dataWorker.terminate();
        };
      }
    }
  }, [enableWebWorker]);

  // Process items in chunks using Web Worker
  useEffect(() => {
    if (worker && items.length > 0) {
      const chunkSize = 100;
      const chunks = [];

      for (let i = 0; i < items.length; i += chunkSize) {
        chunks.push(items.slice(i, i + chunkSize));
      }

      chunks.forEach((chunk) => {
        worker.postMessage({
          type: "PROCESS_CHUNK",
          data: chunk,
          options: {},
        });
      });
    } else {
      setProcessedItems(items);
    }
  }, [items, worker]);

  // Handle search filtering
  useEffect(() => {
    if (searchQuery && worker) {
      worker.postMessage({
        type: "SEARCH_FILTER",
        data: processedItems,
        options: { query: searchQuery },
      });
    } else {
      setFilteredItems(processedItems);
    }
  }, [searchQuery, processedItems, worker]);

  // Detect scroll direction for predictive loading
  const handleScroll = useCallback(
    (scrollTop: number) => {
      const direction = scrollTop > lastScrollTop.current ? "down" : "up";
      setScrollDirection(direction);
      lastScrollTop.current = scrollTop;

      // Predictive loading when scrolling down fast
      if (enablePredictiveLoading && direction === "down" && hasMore && loadMore) {
        const scrollSpeed = Math.abs(scrollTop - lastScrollTop.current);
        if (scrollSpeed > 100) {
          // Fast scroll
          loadMore();
        }
      }
    },
    [hasMore, loadMore, enablePredictiveLoading]
  );

  // Determine if item is loaded
  const isItemLoaded = useCallback(
    (index: number) => {
      return index < filteredItems.length;
    },
    [filteredItems.length]
  );

  // Load more items
  const loadMoreItems = useCallback(async () => {
    if (isLoading || !hasMore || !loadMore) return;

    try {
      const newItems = await loadMore();
      // New items will be processed by the worker
    } catch (error) {
      console.error("Failed to load more items:", error);
    }
  }, [isLoading, hasMore, loadMore]);

  // Item count including loading items
  const itemCount = hasMore ? filteredItems.length + 1 : filteredItems.length;

  // Optimized row renderer with memoization
  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const item = filteredItems[index];

      if (!item) {
        // Loading skeleton
        return (
          <div style={style} className="animate-pulse p-4">
            <div className="flex space-x-4">
              <div className="h-12 w-12 rounded-full bg-gray-200"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                <div className="h-4 w-1/2 rounded bg-gray-200"></div>
              </div>
            </div>
          </div>
        );
      }

      return renderItem(item, index, style);
    },
    [filteredItems, renderItem]
  );

  // Non-virtualized fallback for small lists
  if (!enableVirtualization || filteredItems.length < 20) {
    return (
      <div className={`overflow-auto ${className}`} style={{ height }}>
        {filteredItems.map((item, index) => (
          <div key={index}>{renderItem(item, index, {})}</div>
        ))}
        {isLoading && (
          <div className="p-4 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    );
  }

  // Variable height list
  if (typeof itemHeight === "function") {
    return (
      <div className={className}>
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={itemCount}
          loadMoreItems={loadMoreItems}
        >
          {({ onItemsRendered, ref }) => (
            <VariableSizeList
              ref={(list) => {
                listRef.current = list;
                ref(list);
              }}
              height={height}
              itemCount={itemCount}
              itemSize={(index) => {
                const item = filteredItems[index];
                return item ? itemHeight(index) : 80; // Default height for loading
              }}
              onItemsRendered={onItemsRendered}
              onScroll={({ scrollTop }) => handleScroll(scrollTop)}
              overscanCount={overscan}
              className="ultra-smooth-scroll"
            >
              {Row}
            </VariableSizeList>
          )}
        </InfiniteLoader>
      </div>
    );
  }

  // Fixed height list
  return (
    <div className={className}>
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={itemCount}
        loadMoreItems={loadMoreItems}
      >
        {({ onItemsRendered, ref }) => (
          <FixedSizeList
            ref={(list) => {
              listRef.current = list;
              ref(list);
            }}
            height={height}
            itemCount={itemCount}
            itemSize={itemHeight as number}
            onItemsRendered={onItemsRendered}
            onScroll={({ scrollTop }) => handleScroll(scrollTop)}
            overscanCount={overscan}
            className="ultra-smooth-scroll"
          >
            {Row}
          </FixedSizeList>
        )}
      </InfiniteLoader>
    </div>
  );
}

// Hook for intersection observer
function useIntersectionObserver() {
  const [ref, setRef] = useState<Element | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref]);

  return { setRef, isIntersecting };
}

// Ultra-optimized event list
export function UltraEventList({ events, ...props }: any) {
  const renderEvent = useCallback(
    (event: any, index: number, style: React.CSSProperties) => (
      <div key={event.id} style={style} className="border-b p-4 transition-colors hover:bg-gray-50">
        <div className="flex items-center space-x-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 font-bold text-white">
            {event.title.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold text-gray-900">{event.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-gray-600">{event.shortDescription}</p>
            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
              <span>📅 {new Date(event.startDate).toLocaleDateString()}</span>
              <span>📍 {event.venue}</span>
              <span>👥 {event._count?.registrations || 0}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">${event.price}</div>
            <div className="text-xs text-gray-500">
              {Math.max(0, event.capacity - (event._count?.registrations || 0))} left
            </div>
          </div>
        </div>
      </div>
    ),
    []
  );

  return (
    <UltraList
      items={events}
      height={600}
      itemHeight={120}
      renderItem={renderEvent}
      enableVirtualization={true}
      enableWebWorker={true}
      enablePredictiveLoading={true}
      {...props}
    />
  );
}
