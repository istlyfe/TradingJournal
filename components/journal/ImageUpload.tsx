"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { JournalImage } from "@/types/journal";
import { Image as ImageIcon, X, Plus, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  images: JournalImage[];
  onChange: (images: JournalImage[]) => void;
}

export function ImageUpload({ images, onChange }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      const newImages: JournalImage[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Read the file as data URL (base64)
        const dataUrl = await readFileAsDataURL(file);
        
        const newImage: JournalImage = {
          id: crypto.randomUUID(),
          url: dataUrl,
          caption: '',
          createdAt: new Date().toISOString()
        };
        
        newImages.push(newImage);
      }
      
      onChange([...images, ...newImages]);
    } catch (error) {
      console.error('Error uploading images:', error);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Read file as data URL
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          resolve(event.target.result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  };
  
  // Update image caption
  const updateCaption = (id: string, caption: string) => {
    const updatedImages = images.map(img => 
      img.id === id ? { ...img, caption } : img
    );
    onChange(updatedImages);
  };
  
  // Remove image
  const removeImage = (id: string) => {
    const updatedImages = images.filter(img => img.id !== id);
    onChange(updatedImages);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base">Trading Chart Images</Label>
        
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="gap-1"
        >
          {isUploading ? (
            <span>Uploading...</span>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Add Image</span>
            </>
          )}
        </Button>
        
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      
      {images.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed rounded-md">
          <Camera className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Add screenshots of your trading charts or setups
          </p>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
            className="mt-2"
          >
            <ImageIcon className="h-4 w-4 mr-1" />
            Browse Images
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {images.map(image => (
            <div 
              key={image.id} 
              className="relative border rounded-md p-3 space-y-2"
            >
              <div className="aspect-video w-full overflow-hidden rounded-md bg-muted relative">
                <img 
                  src={image.url} 
                  alt={image.caption || "Trading chart"} 
                  className="object-contain w-full h-full"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={() => removeImage(image.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <Textarea
                value={image.caption || ''}
                onChange={(e) => updateCaption(image.id, e.target.value)}
                placeholder="Add a caption for this image..."
                className="text-sm h-16 resize-none"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 