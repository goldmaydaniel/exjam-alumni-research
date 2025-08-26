import React, { useState, useEffect, useCallback, useRef } from "react";

// Device detection utilities
export const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isTouchDevice: false,
    orientation: "portrait" as "portrait" | "landscape",
    screenSize: "sm" as "xs" | "sm" | "md" | "lg" | "xl",
    platform: "unknown" as "ios" | "android" | "windows" | "macos" | "linux" | "unknown",
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const userAgent = navigator.userAgent.toLowerCase();

      // Screen size detection
      let screenSize: "xs" | "sm" | "md" | "lg" | "xl" = "sm";
      if (width < 480) screenSize = "xs";
      else if (width < 640) screenSize = "sm";
      else if (width < 768) screenSize = "md";
      else if (width < 1024) screenSize = "lg";
      else screenSize = "xl";

      // Device type detection
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;
      const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

      // Platform detection
      let platform: "ios" | "android" | "windows" | "macos" | "linux" | "unknown" = "unknown";
      if (userAgent.includes("iphone") || userAgent.includes("ipad")) platform = "ios";
      else if (userAgent.includes("android")) platform = "android";
      else if (userAgent.includes("windows")) platform = "windows";
      else if (userAgent.includes("macintosh")) platform = "macos";
      else if (userAgent.includes("linux")) platform = "linux";

      // Orientation
      const orientation = height > width ? "portrait" : "landscape";

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        orientation,
        screenSize,
        platform,
      });
    };

    updateDeviceInfo();
    window.addEventListener("resize", updateDeviceInfo);
    window.addEventListener("orientationchange", updateDeviceInfo);

    return () => {
      window.removeEventListener("resize", updateDeviceInfo);
      window.removeEventListener("orientationchange", updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
};

// Touch gesture handling
export const useTouchGestures = (elementRef: React.RefObject<HTMLElement>) => {
  const [gestures, setGestures] = useState({
    isSwipeLeft: false,
    isSwipeRight: false,
    isSwipeUp: false,
    isSwipeDown: false,
    isPinching: false,
    scale: 1,
  });

  const touchStart = useRef({ x: 0, y: 0, time: 0 });
  const touchEnd = useRef({ x: 0, y: 0, time: 0 });

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      setGestures((prev) => ({
        ...prev,
        isSwipeLeft: false,
        isSwipeRight: false,
        isSwipeUp: false,
        isSwipeDown: false,
      }));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Handle pinch gesture
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );

        setGestures((prev) => ({
          ...prev,
          isPinching: true,
          scale: distance / 100, // Normalize scale
        }));
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      touchEnd.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };

      const deltaX = touchEnd.current.x - touchStart.current.x;
      const deltaY = touchEnd.current.y - touchStart.current.y;
      const deltaTime = touchEnd.current.time - touchStart.current.time;

      // Minimum swipe distance and maximum time
      const minSwipeDistance = 50;
      const maxSwipeTime = 300;

      if (deltaTime < maxSwipeTime) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal swipe
          if (Math.abs(deltaX) > minSwipeDistance) {
            setGestures((prev) => ({
              ...prev,
              isSwipeLeft: deltaX < 0,
              isSwipeRight: deltaX > 0,
              isPinching: false,
            }));
          }
        } else {
          // Vertical swipe
          if (Math.abs(deltaY) > minSwipeDistance) {
            setGestures((prev) => ({
              ...prev,
              isSwipeUp: deltaY < 0,
              isSwipeDown: deltaY > 0,
              isPinching: false,
            }));
          }
        }
      }

      setGestures((prev) => ({ ...prev, isPinching: false, scale: 1 }));
    };

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: true });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [elementRef]);

  return gestures;
};

// Safe area handling for notched devices
export const useSafeArea = () => {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);

      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue("--safe-area-inset-top") || "0", 10),
        right: parseInt(computedStyle.getPropertyValue("--safe-area-inset-right") || "0", 10),
        bottom: parseInt(computedStyle.getPropertyValue("--safe-area-inset-bottom") || "0", 10),
        left: parseInt(computedStyle.getPropertyValue("--safe-area-inset-left") || "0", 10),
      });
    };

    updateSafeArea();
    window.addEventListener("resize", updateSafeArea);
    window.addEventListener("orientationchange", updateSafeArea);

    return () => {
      window.removeEventListener("resize", updateSafeArea);
      window.removeEventListener("orientationchange", updateSafeArea);
    };
  }, []);

  return safeArea;
};

// Keyboard avoidance for mobile inputs
export const useKeyboardAvoidance = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initialViewportHeight = window.innerHeight;
    let currentViewportHeight = initialViewportHeight;

    const handleResize = () => {
      currentViewportHeight = window.innerHeight;
      const heightDifference = initialViewportHeight - currentViewportHeight;

      if (heightDifference > 150) {
        // Assume keyboard if height reduces by more than 150px
        setKeyboardHeight(heightDifference);
        setIsKeyboardVisible(true);
      } else {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
      }
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("focusin", handleFocusIn);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, []);

  return { keyboardHeight, isKeyboardVisible };
};

// Responsive breakpoints hook
export const useBreakpoints = () => {
  const [breakpoint, setBreakpoint] = useState<"xs" | "sm" | "md" | "lg" | "xl">("md");

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 480) setBreakpoint("xs");
      else if (width < 640) setBreakpoint("sm");
      else if (width < 768) setBreakpoint("md");
      else if (width < 1024) setBreakpoint("lg");
      else setBreakpoint("xl");
    };

    updateBreakpoint();
    window.addEventListener("resize", updateBreakpoint);

    return () => window.removeEventListener("resize", updateBreakpoint);
  }, []);

  const isXs = breakpoint === "xs";
  const isSm = breakpoint === "sm";
  const isMd = breakpoint === "md";
  const isLg = breakpoint === "lg";
  const isXl = breakpoint === "xl";

  const isMobile = isXs || isSm;
  const isTablet = isMd;
  const isDesktop = isLg || isXl;

  return {
    breakpoint,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    isMobile,
    isTablet,
    isDesktop,
  };
};

// Pull-to-refresh functionality
export const usePullToRefresh = (onRefresh: () => Promise<void>, threshold: number = 100) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      // Only enable at top of page
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isPulling) return;

      currentY.current = e.touches[0].clientY;
      const distance = Math.max(0, currentY.current - startY.current);

      if (distance > 0) {
        setPullDistance(Math.min(distance, threshold * 1.5));
        e.preventDefault();
      }
    },
    [isPulling, threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    document.addEventListener("touchstart", handleTouchStart, { passive: false });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    isPulling,
    pullDistance,
    isRefreshing,
    pullProgress: Math.min(pullDistance / threshold, 1),
  };
};

// Haptic feedback for mobile
export const useHapticFeedback = () => {
  const vibrate = useCallback((pattern: number | number[] = 100) => {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const lightImpact = useCallback(() => vibrate(50), [vibrate]);
  const mediumImpact = useCallback(() => vibrate(100), [vibrate]);
  const heavyImpact = useCallback(() => vibrate(200), [vibrate]);
  const selection = useCallback(() => vibrate([50, 50, 50]), [vibrate]);
  const notification = useCallback(
    (type: "success" | "warning" | "error" = "success") => {
      switch (type) {
        case "success":
          vibrate([100, 50, 100]);
          break;
        case "warning":
          vibrate([100, 50, 100, 50, 100]);
          break;
        case "error":
          vibrate([200, 100, 200]);
          break;
      }
    },
    [vibrate]
  );

  return {
    vibrate,
    lightImpact,
    mediumImpact,
    heavyImpact,
    selection,
    notification,
  };
};

// Mobile-optimized scroll handling
export const useMobileScroll = () => {
  const [scrollData, setScrollData] = useState({
    scrollY: 0,
    scrollDirection: "down" as "up" | "down",
    isScrolling: false,
    isNearTop: true,
    isNearBottom: false,
  });

  const lastScrollY = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

      setScrollData({
        scrollY: currentScrollY,
        scrollDirection: currentScrollY > lastScrollY.current ? "down" : "up",
        isScrolling: true,
        isNearTop: currentScrollY < 100,
        isNearBottom: currentScrollY > maxScroll - 100,
      });

      lastScrollY.current = currentScrollY;

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set scrolling to false after scroll ends
      scrollTimeoutRef.current = setTimeout(() => {
        setScrollData((prev) => ({ ...prev, isScrolling: false }));
      }, 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return scrollData;
};

// Performance-optimized image loading for mobile
export const useMobileImageLoading = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);

  const loadImage = useCallback((src: string, lowQualitySrc?: string) => {
    setLoading(true);
    setError(false);

    // Load low quality first if available
    if (lowQualitySrc) {
      const lowImg = new Image();
      lowImg.onload = () => setLoadedSrc(lowQualitySrc);
      lowImg.src = lowQualitySrc;
    }

    // Then load high quality
    const img = new Image();
    img.onload = () => {
      setLoadedSrc(src);
      setLoading(false);
    };
    img.onerror = () => {
      setError(true);
      setLoading(false);
    };
    img.src = src;
  }, []);

  return { loading, error, loadedSrc, loadImage };
};
