"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { JournalImage } from "@/types/journal";
import { ChevronLeft, ChevronRight, X, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  images: JournalImage[];
  initialIndex?: number;
}

export function ImageViewer({ isOpen, onClose, images, initialIndex = 0 }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  if (!images || images.length === 0) return null;
  
  const currentImage = images[currentIndex];
  
  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };
  
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  
  const downloadImage = () => {
    // Create anchor element
    const a = document.createElement('a');
    a.href = currentImage.url;
    a.download = `trading-chart-${currentImage.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 bg-background/95 backdrop-blur-sm sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl">
        <div className="relative flex flex-col">
          {/* Top controls */}
          <div className="absolute top-2 right-2 z-50 flex items-center space-x-2">
            <Button
              onClick={downloadImage}
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Image container */}
          <div className="relative flex items-center justify-center p-4 pb-12">
            <img 
              src={currentImage.url} 
              alt={currentImage.caption || "Trading chart"} 
              className="max-h-[80vh] max-w-full object-contain"
            />
            
            {/* Navigation buttons */}
            {images.length > 1 && (
              <>
                <Button
                  onClick={goToPrevious}
                  variant="outline"
                  size="icon"
                  className="absolute left-2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  onClick={goToNext}
                  variant="outline"
                  size="icon"
                  className="absolute right-2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
            
            {/* Image caption */}
            {currentImage.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-background/80 backdrop-blur-sm text-center">
                <p className="text-sm font-medium">{currentImage.caption}</p>
              </div>
            )}
            
            {/* Image counter */}
            {images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs">
                {currentIndex + 1} / {images.length}
              </div>
            )}
          </div>
          
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center justify-center space-x-2 p-3 overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "h-16 w-24 rounded-md overflow-hidden border-2 transition-all",
                    index === currentIndex 
                      ? "border-primary ring-2 ring-primary"
                      : "border-transparent opacity-70 hover:opacity-100"
                  )}
                >
                  <img 
                    src={image.url} 
                    alt={image.caption || `Image ${index + 1}`}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 