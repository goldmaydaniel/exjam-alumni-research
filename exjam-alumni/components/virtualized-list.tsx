"use client";

import { FixedSizeList, VariableSizeList } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import { useCallback, useRef, memo, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight: number | ((index: number) => number);
  renderItem: (item: T, index: number) => React.ReactNode;
  hasNextPage?: boolean;
  loadNextPage?: () => Promise<void>;
  isNextPageLoading?: boolean;
  className?: string;
  overscan?: number;
}

// Fixed height virtualized list
export function VirtualizedList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  hasNextPage = false,
  loadNextPage,
  isNextPageLoading = false,
  className = "",
  overscan = 5,
}: VirtualizedListProps<T>) {
  const listRef = useRef<FixedSizeList>(null);

  // Determine if an item is loaded
  const isItemLoaded = useCallback(
    (index: number) => {
      return index < items.length;
    },
    [items.length]
  );

  // Load more items
  const loadMoreItems = useCallback(async () => {
    if (isNextPageLoading) return;
    await loadNextPage?.();
  }, [loadNextPage, isNextPageLoading]);

  // Total count including loading items
  const itemCount = hasNextPage ? items.length + 1 : items.length;

  // Memoized row renderer
  const Row = memo(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];

    if (!item) {
      // Loading skeleton
      return (
        <div style={style} className="p-2">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div style={style} className="p-2">
        {renderItem(item, index)}
      </div>
    );
  });

  Row.displayName = "VirtualizedRow";

  if (typeof itemHeight === "function") {
    // Variable height list
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
                listRef.current = list as any;
                ref(list);
              }}
              height={height}
              itemCount={itemCount}
              itemSize={itemHeight}
              onItemsRendered={onItemsRendered}
              overscanCount={overscan}
              className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
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
            overscanCount={overscan}
            className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          >
            {Row}
          </FixedSizeList>
        )}
      </InfiniteLoader>
    </div>
  );
}

// Event list component using virtualization
interface EventListProps {
  events: any[];
  onEventClick: (event: any) => void;
  hasNextPage?: boolean;
  loadNextPage?: () => Promise<void>;
  isLoading?: boolean;
}

export function VirtualizedEventList({
  events,
  onEventClick,
  hasNextPage,
  loadNextPage,
  isLoading,
}: EventListProps) {
  const renderEvent = useCallback(
    (event: any, index: number) => (
      <Card
        key={event.id}
        className="cursor-pointer transition-shadow duration-200 hover:shadow-lg"
        onClick={() => onEventClick(event)}
      >
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-xl font-bold text-white">
              {event.title.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-semibold text-gray-900">{event.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-gray-600">{event.shortDescription}</p>
              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                <span>📅 {new Date(event.startDate).toLocaleDateString()}</span>
                <span>📍 {event.venue}</span>
                <span>👥 {event._count?.registrations || 0} registered</span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">${event.price}</div>
                <div className="text-xs text-gray-500">
                  {event.capacity - (event._count?.registrations || 0)} spots left
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    ),
    [onEventClick]
  );

  return (
    <VirtualizedList
      items={events}
      height={600}
      itemHeight={140}
      renderItem={renderEvent}
      hasNextPage={hasNextPage}
      loadNextPage={loadNextPage}
      isNextPageLoading={isLoading}
      className="w-full"
    />
  );
}

// User list component using virtualization
interface UserListProps {
  users: any[];
  onUserClick: (user: any) => void;
  hasNextPage?: boolean;
  loadNextPage?: () => Promise<void>;
  isLoading?: boolean;
}

export function VirtualizedUserList({
  users,
  onUserClick,
  hasNextPage,
  loadNextPage,
  isLoading,
}: UserListProps) {
  const renderUser = useCallback(
    (user: any, index: number) => (
      <Card
        key={user.id}
        className="cursor-pointer transition-shadow duration-200 hover:shadow-md"
        onClick={() => onUserClick(user)}
      >
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {user.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 font-bold text-white">
                  {user.firstName.charAt(0)}
                  {user.lastName.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-base font-semibold text-gray-900">
                {user.firstName} {user.lastName}
              </h4>
              <p className="truncate text-sm text-gray-600">{user.email}</p>
              <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                {user.serviceNumber && <span>🔢 {user.serviceNumber}</span>}
                {user.squadron && <span>✈️ {user.squadron}</span>}
                {user.graduationYear && <span>🎓 {user.graduationYear}</span>}
              </div>
            </div>
            <div className="flex-shrink-0">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  user.role === "ADMIN"
                    ? "bg-red-100 text-red-800"
                    : user.role === "ORGANIZER"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                }`}
              >
                {user.role}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    ),
    [onUserClick]
  );

  return (
    <VirtualizedList
      items={users}
      height={500}
      itemHeight={100}
      renderItem={renderUser}
      hasNextPage={hasNextPage}
      loadNextPage={loadNextPage}
      isNextPageLoading={isLoading}
      className="w-full"
    />
  );
}

// Registration list with variable height
export function VirtualizedRegistrationList({
  registrations,
  onRegistrationClick,
  hasNextPage,
  loadNextPage,
  isLoading,
}: {
  registrations: any[];
  onRegistrationClick: (registration: any) => void;
  hasNextPage?: boolean;
  loadNextPage?: () => Promise<void>;
  isLoading?: boolean;
}) {
  // Calculate dynamic height based on content
  const getItemHeight = useCallback(
    (index: number) => {
      const registration = registrations[index];
      if (!registration) return 120; // Loading skeleton height

      let baseHeight = 100;

      // Add height for special requests
      if (registration.specialRequests) {
        baseHeight += 30;
      }

      // Add height for ticket information
      if (registration.ticket) {
        baseHeight += 40;
      }

      return baseHeight;
    },
    [registrations]
  );

  const renderRegistration = useCallback(
    (registration: any, index: number) => (
      <Card
        key={registration.id}
        className="cursor-pointer transition-shadow duration-200 hover:shadow-md"
        onClick={() => onRegistrationClick(registration)}
      >
        <CardContent className="p-4">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-blue-600 text-sm font-bold text-white">
                {registration.user?.firstName?.charAt(0) || "R"}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-semibold text-gray-900">
                  {registration.user?.firstName} {registration.user?.lastName}
                </h4>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    registration.status === "CONFIRMED"
                      ? "bg-green-100 text-green-800"
                      : registration.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {registration.status}
                </span>
              </div>

              <p className="text-sm text-gray-600">{registration.event?.title}</p>

              <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                <span>🎫 {registration.ticketType}</span>
                <span>📅 {new Date(registration.createdAt).toLocaleDateString()}</span>
                {registration.ticket && (
                  <span
                    className={`${registration.ticket.checkedIn ? "text-green-600" : "text-gray-500"}`}
                  >
                    {registration.ticket.checkedIn ? "✅ Checked In" : "⏳ Not Checked In"}
                  </span>
                )}
              </div>

              {registration.specialRequests && (
                <p className="mt-2 rounded bg-gray-50 p-2 text-xs text-gray-600">
                  📝 {registration.specialRequests}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    ),
    [onRegistrationClick]
  );

  return (
    <VirtualizedList
      items={registrations}
      height={600}
      itemHeight={getItemHeight}
      renderItem={renderRegistration}
      hasNextPage={hasNextPage}
      loadNextPage={loadNextPage}
      isNextPageLoading={isLoading}
      className="w-full"
    />
  );
}
