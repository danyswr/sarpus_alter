import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
  imageUrl?: string;
  onRemoveImage?: () => void;
}

export function ImageUpload({ onImageUpload, imageUrl, onRemoveImage }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File size must be less than 5MB');
        return;
      }
      onImageUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  if (imageUrl) {
    return (
      <div className="relative">
        <img 
          src={imageUrl} 
          alt="Uploaded preview" 
          className="w-full max-w-md rounded-lg border"
        />
        {onRemoveImage && (
          <Button
            onClick={onRemoveImage}
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-gray-300 hover:border-primary"
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
    >
      <Upload className="mx-auto text-gray-400 mb-2" size={32} />
      <p className="text-gray-600">Klik atau drag & drop gambar</p>
      <p className="text-gray-400 text-sm">Maksimal 5MB</p>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
