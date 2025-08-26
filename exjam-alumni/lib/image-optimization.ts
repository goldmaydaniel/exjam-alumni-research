/**
 * Image Optimization Utilities
 * Provides comprehensive image optimization and performance monitoring
 */

export interface ImageOptimizationConfig {
  quality: number;
  format: "webp" | "avif" | "jpeg" | "png" | "auto";
  width?: number;
  height?: number;
  blur?: boolean;
  grayscale?: boolean;
  cropMode: "cover" | "contain" | "crop" | "scale";
  cropGravity?: "center" | "north" | "south" | "east" | "west" | "face" | "auto";
}

export interface DeviceBreakpoint {
  name: string;
  width: number;
  quality: number;
  format?: string;
}

// Default device breakpoints optimized for performance
export const DEFAULT_BREAKPOINTS: DeviceBreakpoint[] = [
  { name: "mobile", width: 375, quality: 75, format: "webp" },
  { name: "mobile-lg", width: 428, quality: 80, format: "webp" },
  { name: "tablet", width: 768, quality: 82, format: "webp" },
  { name: "desktop", width: 1024, quality: 85, format: "webp" },
  { name: "desktop-lg", width: 1280, quality: 85, format: "webp" },
  { name: "desktop-xl", width: 1920, quality: 88, format: "webp" },
];

// Presets for common use cases
export const IMAGE_PRESETS = {
  avatar: {
    quality: 90,
    format: "webp" as const,
    cropMode: "cover" as const,
    cropGravity: "face" as const,
    breakpoints: [
      { name: "small", width: 40, quality: 85 },
      { name: "medium", width: 80, quality: 90 },
      { name: "large", width: 128, quality: 90 },
    ],
  },
  thumbnail: {
    quality: 80,
    format: "webp" as const,
    cropMode: "cover" as const,
    breakpoints: [
      { name: "small", width: 150, quality: 75 },
      { name: "medium", width: 300, quality: 80 },
      { name: "large", width: 400, quality: 85 },
    ],
  },
  card: {
    quality: 82,
    format: "webp" as const,
    cropMode: "cover" as const,
    breakpoints: DEFAULT_BREAKPOINTS.filter((bp) => bp.width <= 1024),
  },
  hero: {
    quality: 88,
    format: "webp" as const,
    cropMode: "cover" as const,
    breakpoints: DEFAULT_BREAKPOINTS,
  },
  gallery: {
    quality: 85,
    format: "webp" as const,
    cropMode: "cover" as const,
    breakpoints: [
      { name: "thumb", width: 300, quality: 80 },
      { name: "preview", width: 600, quality: 85 },
      { name: "full", width: 1200, quality: 90 },
    ],
  },
  content: {
    quality: 85,
    format: "auto" as const,
    cropMode: "contain" as const,
    breakpoints: DEFAULT_BREAKPOINTS.filter((bp) => bp.width <= 1280),
  },
};

/**
 * Generate optimized image URL with parameters
 */
export function generateOptimizedImageUrl(
  src: string,
  config: Partial<ImageOptimizationConfig> = {}
): string {
  if (!src) return "";

  try {
    const url = new URL(src, typeof window !== "undefined" ? window.location.origin : "");
    const isExternal = typeof window !== "undefined" && url.hostname !== window.location.hostname;

    if (isExternal) return src;

    const params = new URLSearchParams();

    if (config.width) params.set("w", config.width.toString());
    if (config.height) params.set("h", config.height.toString());
    if (config.quality) params.set("q", config.quality.toString());
    if (config.format && config.format !== "auto") params.set("f", config.format);
    if (config.blur) params.set("blur", "10");
    if (config.grayscale) params.set("grayscale", "true");
    if (config.cropMode && config.cropMode !== "scale") params.set("crop", config.cropMode);
    if (config.cropGravity) params.set("gravity", config.cropGravity);

    const paramString = params.toString();
    return paramString ? `${src}?${paramString}` : src;
  } catch {
    return src;
  }
}

/**
 * Generate responsive image sources for different breakpoints
 */
export function generateResponsiveImageSources(
  src: string,
  preset: keyof typeof IMAGE_PRESETS,
  customBreakpoints?: DeviceBreakpoint[]
): string {
  const presetConfig = IMAGE_PRESETS[preset];
  const breakpoints = customBreakpoints || presetConfig.breakpoints;

  return breakpoints
    .map((bp) => {
      const config: Partial<ImageOptimizationConfig> = {
        width: bp.width,
        quality: bp.quality || presetConfig.quality,
        format: (bp.format as any) || presetConfig.format,
        cropMode: presetConfig.cropMode,
        cropGravity: presetConfig.cropGravity,
      };

      const optimizedUrl = generateOptimizedImageUrl(src, config);
      return `${optimizedUrl} ${bp.width}w`;
    })
    .join(", ");
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizesAttribute(
  breakpoints: Array<{ minWidth?: number; maxWidth?: number; vw: number; px?: number }>
): string {
  return breakpoints
    .map((bp) => {
      let condition = "";

      if (bp.minWidth && bp.maxWidth) {
        condition = `(min-width: ${bp.minWidth}px) and (max-width: ${bp.maxWidth}px)`;
      } else if (bp.minWidth) {
        condition = `(min-width: ${bp.minWidth}px)`;
      } else if (bp.maxWidth) {
        condition = `(max-width: ${bp.maxWidth}px)`;
      }

      const size = bp.px ? `${bp.px}px` : `${bp.vw}vw`;

      return condition ? `${condition} ${size}` : size;
    })
    .join(", ");
}

/**
 * Detect optimal image format based on browser support
 */
export function detectOptimalFormat(): "avif" | "webp" | "jpeg" {
  if (typeof window === "undefined") return "webp";

  // Check AVIF support
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const avifSupport = canvas.toDataURL("image/avif").indexOf("data:image/avif") === 0;

  if (avifSupport) return "avif";

  // Check WebP support
  const webpSupport = canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;

  return webpSupport ? "webp" : "jpeg";
}

/**
 * Performance monitoring for images
 */
export class ImagePerformanceMonitor {
  private static instance: ImagePerformanceMonitor;
  private metrics: Map<string, ImageMetrics> = new Map();

  private constructor() {}

  static getInstance(): ImagePerformanceMonitor {
    if (!ImagePerformanceMonitor.instance) {
      ImagePerformanceMonitor.instance = new ImagePerformanceMonitor();
    }
    return ImagePerformanceMonitor.instance;
  }

  startTracking(src: string): void {
    this.metrics.set(src, {
      src,
      startTime: performance.now(),
      loadTime: 0,
      size: 0,
      format: this.extractFormat(src),
      error: false,
    });
  }

  recordLoad(src: string, size?: number): void {
    const metric = this.metrics.get(src);
    if (metric) {
      metric.loadTime = performance.now() - metric.startTime;
      if (size) metric.size = size;

      // Report to analytics if available
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "image_load", {
          custom_parameters: {
            load_time: Math.round(metric.loadTime),
            image_size: metric.size,
            image_format: metric.format,
          },
        });
      }
    }
  }

  recordError(src: string): void {
    const metric = this.metrics.get(src);
    if (metric) {
      metric.error = true;
      metric.loadTime = performance.now() - metric.startTime;
    }
  }

  getMetrics(src?: string): ImageMetrics | ImageMetrics[] {
    if (src) {
      return this.metrics.get(src) || null;
    }
    return Array.from(this.metrics.values());
  }

  clearMetrics(): void {
    this.metrics.clear();
  }

  private extractFormat(src: string): string {
    try {
      const url = new URL(src, window.location.origin);
      const formatParam = url.searchParams.get("f");
      if (formatParam) return formatParam;

      const extension = src.split(".").pop()?.split("?")[0];
      return extension || "unknown";
    } catch {
      return "unknown";
    }
  }
}

interface ImageMetrics {
  src: string;
  startTime: number;
  loadTime: number;
  size: number;
  format: string;
  error: boolean;
}

/**
 * Preload critical images
 */
export function preloadImage(
  src: string,
  preset: keyof typeof IMAGE_PRESETS = "content"
): Promise<void> {
  return new Promise((resolve, reject) => {
    const monitor = ImagePerformanceMonitor.getInstance();
    monitor.startTracking(src);

    const img = new Image();

    img.onload = () => {
      monitor.recordLoad(src);
      resolve();
    };

    img.onerror = () => {
      monitor.recordError(src);
      reject(new Error(`Failed to preload image: ${src}`));
    };

    const optimizedSrc = generateOptimizedImageUrl(src, {
      ...IMAGE_PRESETS[preset],
      width: window.innerWidth > 768 ? 1200 : 800,
    });

    img.src = optimizedSrc;
  });
}

/**
 * Preload multiple images with priority
 */
export async function preloadImages(
  sources: Array<{ src: string; preset?: keyof typeof IMAGE_PRESETS; priority?: number }>
): Promise<void> {
  // Sort by priority (higher numbers first)
  const sortedSources = sources.sort((a, b) => (b.priority || 0) - (a.priority || 0));

  // Load high priority images first, then batch load the rest
  const highPriority = sortedSources.filter((s) => (s.priority || 0) >= 10);
  const lowPriority = sortedSources.filter((s) => (s.priority || 0) < 10);

  // Load high priority images sequentially
  for (const source of highPriority) {
    try {
      await preloadImage(source.src, source.preset);
    } catch (error) {
      console.warn("Failed to preload high priority image:", source.src);
    }
  }

  // Load low priority images in parallel
  const lowPriorityPromises = lowPriority.map((source) =>
    preloadImage(source.src, source.preset).catch((error) => {
      console.warn("Failed to preload low priority image:", source.src);
    })
  );

  await Promise.allSettled(lowPriorityPromises);
}

/**
 * Generate placeholder blur data URL
 */
export function generateBlurDataURL(
  width: number = 40,
  height: number = 30,
  color: string = "#f3f4f6"
): string {
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}"/>
    </svg>
  `;

  const base64 = typeof window !== "undefined" ? btoa(svg) : Buffer.from(svg).toString("base64");

  return `data:image/svg+xml;base64,${base64}`;
}

export default {
  generateOptimizedImageUrl,
  generateResponsiveImageSources,
  generateSizesAttribute,
  detectOptimalFormat,
  ImagePerformanceMonitor,
  preloadImage,
  preloadImages,
  generateBlurDataURL,
  IMAGE_PRESETS,
  DEFAULT_BREAKPOINTS,
};
