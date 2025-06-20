import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ImageUploadWithPreviewProps {
  onImageUpload: (file: File) => void;
  onImageRemove: () => void;
  imageUrl?: string;
  isUploading?: boolean;
  disabled?: boolean;
}

export function ImageUploadWithPreview({
  onImageUpload,
  onImageRemove,
  imageUrl,
  isUploading = false,
  disabled = false
}: ImageUploadWithPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Ukuran file maksimal 5MB');
        return;
      }
      
      // Create preview URL immediately
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
      // Upload the file
      onImageUpload(file);
    }
  };

  const handleRemoveImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onImageRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Show uploaded image or preview
  const displayUrl = imageUrl || previewUrl;

  if (displayUrl) {
    return (
      <div className="relative inline-block w-full max-w-md">
        <div className="relative">
          {isUploading ? (
            <div className="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex flex-col items-center justify-center text-gray-500">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
              <span className="text-sm">Mengupload ke Google Drive...</span>
            </div>
          ) : (
            <img 
              src={displayUrl}
              alt="Preview gambar" 
              className="w-full h-auto rounded-lg border border-gray-200 max-h-96 object-cover"
              onLoad={() => {
                console.log("Image preview loaded:", displayUrl);
              }}
              onError={(e) => {
                console.error("Image preview failed to load:", displayUrl);
                // If the imageUrl fails, try using the preview
                if (imageUrl && previewUrl && displayUrl === imageUrl) {
                  (e.target as HTMLImageElement).src = previewUrl;
                }
              }}
            />
          )}
          
          {!disabled && (
            <Button
              onClick={handleRemoveImage}
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 shadow-lg"
              type="button"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        isDragging && !disabled
          ? "border-blue-500 bg-blue-50"
          : disabled
          ? "border-gray-200 bg-gray-50 cursor-not-allowed"
          : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
    >
      <div className="flex flex-col items-center space-y-2">
        {isUploading ? (
          <>
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <p className="text-sm text-gray-600">Mengupload...</p>
          </>
        ) : (
          <>
            <ImageIcon className="w-8 h-8 text-gray-400" />
            <p className="text-sm text-gray-600">
              {disabled ? "Upload dinonaktifkan" : "Klik atau drag & drop gambar"}
            </p>
            {!disabled && (
              <p className="text-xs text-gray-400">Maksimal 5MB (JPG, PNG, GIF)</p>
            )}
          </>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}