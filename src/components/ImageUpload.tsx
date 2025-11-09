import { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  onImageSelect: (file: File, preview: string) => void;
  preview: string | null;
  onClear: () => void;
  disabled?: boolean;
}

export const ImageUpload = ({ onImageSelect, preview, onClear, disabled }: ImageUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          onImageSelect(file, e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [onImageSelect, disabled]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          onImageSelect(file, e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [onImageSelect]
  );

  return (
    <div className="w-full">
      {!preview ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-lg p-12 text-center transition-all",
            isDragging ? "border-primary bg-secondary/50 scale-[1.02]" : "border-border bg-card",
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary hover:bg-secondary/30"
          )}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Upload className="w-10 h-10 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground mb-1">
                Drop your plant image here
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse from your device
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Supports: JPG, PNG, WEBP
            </p>
          </div>
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border-2 border-border bg-card">
          <img
            src={preview}
            alt="Plant preview"
            className="w-full h-auto max-h-96 object-contain"
          />
          <Button
            onClick={onClear}
            disabled={disabled}
            variant="destructive"
            size="icon"
            className="absolute top-4 right-4 shadow-lg"
          >
            <X className="w-4 h-4" />
          </Button>
          <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm px-3 py-2 rounded-md flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Image ready for analysis</span>
          </div>
        </div>
      )}
    </div>
  );
};