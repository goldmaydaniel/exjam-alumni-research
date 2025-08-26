"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Calendar,
  Users,
  FileText,
  Settings,
  Home,
  DollarSign,
  MapPin,
  Clock,
  ArrowRight,
  Command,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SearchResult {
  id: string;
  type: "event" | "user" | "document" | "page";
  title: string;
  description?: string;
  url: string;
  icon: React.ReactNode;
  metadata?: any;
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recent-searches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }

      if (isOpen) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === "Enter" && results[selectedIndex]) {
          e.preventDefault();
          handleSelectResult(results[selectedIndex]);
        } else if (e.key === "Escape") {
          setIsOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Debounced search function
  const debouncedSearch = useCallback((searchQuery: string) => {
    setTimeout(() => performSearchInternal(searchQuery), 300);
  }, []);

  const performSearchInternal = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();

        // Transform results
        const transformedResults: SearchResult[] = [
          // Events
          ...(data.events || []).map((event: any) => ({
            id: event.id,
            type: "event" as const,
            title: event.title,
            description: `${event.venue} • ${new Date(event.startDate).toLocaleDateString()}`,
            url: `/events/${event.id}`,
            icon: <Calendar className="h-4 w-4" />,
            metadata: event,
          })),

          // Users
          ...(data.users || []).map((user: any) => ({
            id: user.id,
            type: "user" as const,
            title: `${user.firstName} ${user.lastName}`,
            description: user.email,
            url: `/users/${user.id}`,
            icon: <Users className="h-4 w-4" />,
            metadata: user,
          })),

          // Pages
          ...(data.pages || []).map((page: any) => ({
            id: page.path,
            type: "page" as const,
            title: page.title,
            description: page.description,
            url: page.path,
            icon: <FileText className="h-4 w-4" />,
            metadata: page,
          })),
        ];

        setResults(transformedResults);
      }
    } catch (error) {
      console.error("Search error:", error);

      // Fallback to local search
      const localResults = getLocalSearchResults(searchQuery);
      setResults(localResults);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = debouncedSearch;

  // Local search for quick navigation
  const getLocalSearchResults = (searchQuery: string): SearchResult[] => {
    const query = searchQuery.toLowerCase();
    const pages = [
      { title: "Home", path: "/", icon: <Home className="h-4 w-4" /> },
      { title: "Events", path: "/events", icon: <Calendar className="h-4 w-4" /> },
      { title: "Dashboard", path: "/dashboard", icon: <FileText className="h-4 w-4" /> },
      { title: "Profile", path: "/profile", icon: <Users className="h-4 w-4" /> },
      { title: "Settings", path: "/settings", icon: <Settings className="h-4 w-4" /> },
      { title: "Admin Check-in", path: "/admin/checkin", icon: <Users className="h-4 w-4" /> },
      { title: "About", path: "/about", icon: <FileText className="h-4 w-4" /> },
      { title: "Contact", path: "/contact", icon: <FileText className="h-4 w-4" /> },
    ];

    return pages
      .filter((page) => page.title.toLowerCase().includes(query))
      .map((page) => ({
        id: page.path,
        type: "page" as const,
        title: page.title,
        url: page.path,
        icon: page.icon,
      }));
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    setSelectedIndex(0);
    performSearch(value);
  };

  const handleSelectResult = (result: SearchResult) => {
    // Save to recent searches
    const updated = [result.title, ...recentSearches.filter((s) => s !== result.title)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recent-searches", JSON.stringify(updated));

    // Navigate to result
    router.push(result.url);
    setIsOpen(false);
    setQuery("");
    setResults([]);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recent-searches");
    toast.success("Search history cleared");
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-900 sm:inline-flex">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>

      {/* Search Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl overflow-hidden p-0">
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search events, users, documents..."
              className="flex-1 border-0 p-0 text-base focus:ring-0"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  inputRef.current?.focus();
                }}
                className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading && (
              <div className="space-y-3 p-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="flex-1">
                      <Skeleton className="mb-2 h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="py-2">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelectResult(result)}
                    className={`flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      index === selectedIndex ? "bg-gray-50 dark:bg-gray-800" : ""
                    }`}
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                      {result.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {result.title}
                      </div>
                      {result.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {result.description}
                        </div>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {result.type}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </button>
                ))}
              </div>
            )}

            {!loading && query && results.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Search className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                <p className="text-sm">No results found for "{query}"</p>
                <p className="mt-1 text-xs">Try searching with different keywords</p>
              </div>
            )}

            {!loading && !query && recentSearches.length > 0 && (
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Recent Searches
                  </h3>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(search)}
                      className="w-full rounded px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                    >
                      <Clock className="mr-2 inline h-3 w-3" />
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t bg-gray-50 px-4 py-2 dark:bg-gray-900">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-gray-300 bg-white px-1.5 py-0.5 dark:border-gray-600 dark:bg-gray-800">
                  ↑↓
                </kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-gray-300 bg-white px-1.5 py-0.5 dark:border-gray-600 dark:bg-gray-800">
                  Enter
                </kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-gray-300 bg-white px-1.5 py-0.5 dark:border-gray-600 dark:bg-gray-800">
                  Esc
                </kbd>
                Close
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
