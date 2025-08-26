"use client";

import { useState, useCallback, useEffect } from "react";
import * as React from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Share2,
  Grid3X3,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  title?: string;
  description?: string;
  tags?: string[];
}

interface ResponsiveImageGalleryProps {
  images: GalleryImage[];
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  aspectRatio?: "square" | "4/3" | "3/2" | "16/9" | "auto";
  showLightbox?: boolean;
  showTitles?: boolean;
  showDescriptions?: boolean;
  allowDownload?: boolean;
  allowShare?: boolean;
  className?: string;
}

export default function ResponsiveImageGallery({
  images,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  aspectRatio = "4/3",
  showLightbox = true,
  showTitles = true,
  showDescriptions = false,
  allowDownload = false,
  allowShare = false,
  className,
}: ResponsiveImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  // Grid column classes
  const gridClasses = {
    mobile: {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
    },
    tablet: {
      1: "md:grid-cols-1",
      2: "md:grid-cols-2",
      3: "md:grid-cols-3",
      4: "md:grid-cols-4",
    },
    desktop: {
      1: "lg:grid-cols-1",
      2: "lg:grid-cols-2",
      3: "lg:grid-cols-3",
      4: "lg:grid-cols-4",
      5: "lg:grid-cols-5",
      6: "lg:grid-cols-6",
    },
  };

  const openLightbox = useCallback(
    (image: GalleryImage, index: number) => {
      if (!showLightbox) return;
      setSelectedImage(image);
      setCurrentIndex(index);
      setIsZoomed(false);
    },
    [showLightbox]
  );

  const closeLightbox = useCallback(() => {
    setSelectedImage(null);
    setIsZoomed(false);
  }, []);

  const navigateImage = useCallback(
    (direction: "prev" | "next") => {
      const newIndex =
        direction === "next"
          ? (currentIndex + 1) % images.length
          : currentIndex === 0
            ? images.length - 1
            : currentIndex - 1;

      setCurrentIndex(newIndex);
      setSelectedImage(images[newIndex]);
      setIsZoomed(false);
    },
    [currentIndex, images]
  );

  const handleImageLoad = useCallback((src: string) => {
    setLoadedImages((prev) => new Set(prev).add(src));
  }, []);

  const handleDownload = async (image: GalleryImage) => {
    if (!allowDownload) return;

    try {
      const response = await fetch(image.src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = image.title || `image-${image.id}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleShare = async (image: GalleryImage) => {
    if (!allowShare) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: image.title || "Image",
          text: image.description || "Check out this image",
          url: image.src,
        });
      } catch (error) {
        console.error("Share failed:", error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(image.src);
        // You could show a toast notification here
      } catch (error) {
        console.error("Copy to clipboard failed:", error);
      }
    }
  };

  // Keyboard navigation
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (!selectedImage) return;

      switch (event.key) {
        case "Escape":
          closeLightbox();
          break;
        case "ArrowLeft":
          navigateImage("prev");
          break;
        case "ArrowRight":
          navigateImage("next");
          break;
        case " ":
          event.preventDefault();
          setIsZoomed(!isZoomed);
          break;
      }
    },
    [selectedImage, closeLightbox, navigateImage, isZoomed]
  );

  // Add keyboard event listeners
  React.useEffect(() => {
    if (selectedImage) {
      document.addEventListener("keydown", handleKeyPress);
      document.body.style.overflow = "hidden";

      return () => {
        document.removeEventListener("keydown", handleKeyPress);
        document.body.style.overflow = "";
      };
    }
  }, [selectedImage, handleKeyPress]);

  return (
    <>
      {/* Gallery Grid */}
      <div
        className={cn(
          "grid gap-4",
          gridClasses.mobile[Math.min(columns.mobile, 3) as 1 | 2 | 3],
          gridClasses.tablet[Math.min(columns.tablet, 4) as 1 | 2 | 3 | 4],
          gridClasses.desktop[Math.min(columns.desktop, 6) as 1 | 2 | 3 | 4 | 5 | 6],
          className
        )}
      >
        {images.map((image, index) => (
          <Card key={image.id} className="group overflow-hidden">
            <div className="relative">
              <GalleryImage
                src={image.src}
                alt={image.alt}
                aspectRatio={aspectRatio}
                onClick={() => openLightbox(image, index)}
                showOverlay={showLightbox}
                className="cursor-pointer"
                onLoad={() => handleImageLoad(image.src)}
                lazy={index > 8} // Load first 9 images immediately
                overlayContent={
                  <div className="flex items-center justify-center">
                    <div className="rounded-full bg-black/50 p-3 backdrop-blur-sm">
                      <ImageIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                }
              />

              {/* Image Info Overlay */}
              {(showTitles || showDescriptions) && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
                  {showTitles && image.title && (
                    <h3 className="truncate text-sm font-semibold text-white">{image.title}</h3>
                  )}
                  {showDescriptions && image.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-white/80">{image.description}</p>
                  )}
                </div>
              )}

              {/* Loading indicator */}
              {!loadedImages.has(image.src) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && showLightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm">
          {/* Header */}
          <div className="absolute left-0 right-0 top-0 z-10 bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4 text-white">
                <span className="text-sm">
                  {currentIndex + 1} of {images.length}
                </span>
                {selectedImage.title && <h2 className="font-semibold">{selectedImage.title}</h2>}
              </div>

              <div className="flex items-center gap-2">
                {/* Zoom Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsZoomed(!isZoomed)}
                  className="text-white hover:bg-white/10"
                >
                  {isZoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
                </Button>

                {/* Download */}
                {allowDownload && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(selectedImage)}
                    className="text-white hover:bg-white/10"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}

                {/* Share */}
                {allowShare && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare(selectedImage)}
                    className="text-white hover:bg-white/10"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                )}

                {/* Close */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeLightbox}
                  className="text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Main Image */}
          <div className="flex h-full items-center justify-center p-4 pb-16 pt-20">
            <div
              className={cn(
                "relative transition-transform duration-300",
                isZoomed && "scale-150 cursor-move"
              )}
            >
              <ResponsiveImage
                src={selectedImage.src}
                alt={selectedImage.alt}
                aspectRatio="auto"
                className="max-h-[80vh] max-w-[90vw] object-contain"
                priority
                quality={95}
              />
            </div>
          </div>

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => navigateImage("prev")}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full p-3 text-white hover:bg-white/10"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              <Button
                variant="ghost"
                size="lg"
                onClick={() => navigateImage("next")}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-3 text-white hover:bg-white/10"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Description */}
          {selectedImage.description && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent">
              <div className="p-4 text-white">
                <p className="text-sm">{selectedImage.description}</p>
                {selectedImage.tags && selectedImage.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedImage.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-white/10 px-2 py-1 text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
