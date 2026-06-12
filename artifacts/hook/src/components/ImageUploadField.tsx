import { useRef, useState, useCallback } from "react";
import { useUpload } from "@workspace/object-storage-web";
import { Upload, X, ImagePlus, Loader2 } from "lucide-react";
import { CropModal } from "./CropModal";
import { API_BASE, resolveImageUrl } from "@/lib/apiBase";

const BASE = API_BASE;

function toServingUrl(objectPath: string): string {
  return `${BASE}/api/storage${objectPath}`;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error("FileReader error"));
    reader.readAsDataURL(file);
  });
}

interface SingleImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export function SingleImageUpload({ value, onChange, label = "Main Product Image" }: SingleImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const { uploadFile, isUploading, progress } = useUpload({
    basePath: `${BASE}/api/storage`,
    onSuccess: (res) => {
      onChange(toServingUrl(res.objectPath));
    },
  });

  const openCrop = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const dataUrl = await readAsDataUrl(file);
    setPendingFile(file);
    setCropSrc(dataUrl);
  }, []);

  const handleCropConfirm = useCallback(async (blob: Blob) => {
    setCropSrc(null);
    const file = new File([blob], pendingFile?.name ?? "image.jpg", { type: "image/jpeg" });
    setPendingFile(null);
    await uploadFile(file);
  }, [pendingFile, uploadFile]);

  const handleCropSkip = useCallback(async () => {
    const file = pendingFile;
    setCropSrc(null);
    setPendingFile(null);
    if (file) await uploadFile(file);
  }, [pendingFile, uploadFile]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) openCrop(file);
    },
    [openCrop]
  );

  return (
    <>
      {cropSrc && (
        <CropModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onSkip={handleCropSkip}
        />
      )}

      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</label>

        {value ? (
          <div className="relative group">
            <div className="aspect-[3/4] w-full max-w-[160px] overflow-hidden bg-[#ddd5c8]">
              <img src={resolveImageUrl(value)} alt="Product" className="w-full h-full object-cover" />
            </div>
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-1.5 right-1.5 w-7 h-7 bg-background/90 flex items-center justify-center hover:bg-background transition-colors"
              title="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-background/90 text-[9px] tracking-widest uppercase px-3 py-1.5 hover:bg-background transition-colors whitespace-nowrap"
            >
              Replace
            </button>
          </div>
        ) : (
          <div
            onClick={() => !isUploading && inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            className={`relative flex flex-col items-center justify-center gap-2 border border-dashed cursor-pointer transition-colors min-h-[140px] px-4 py-6 ${
              isDragging ? "border-foreground bg-accent/50" : "border-border hover:border-foreground/40 hover:bg-accent/20"
            } ${isUploading ? "pointer-events-none" : ""}`}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
                  Uploading {progress}%
                </p>
                <div className="w-full max-w-[120px] h-0.5 bg-border overflow-hidden">
                  <div
                    className="h-full bg-foreground transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <Upload className="h-6 w-6 text-muted-foreground/50" strokeWidth={1.5} />
                <p className="text-[10px] tracking-widest uppercase text-muted-foreground text-center">
                  Click or drop to upload
                </p>
                <p className="text-[9px] text-muted-foreground/60">JPG · PNG · WEBP</p>
              </>
            )}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) openCrop(f); e.target.value = ""; }}
        />
      </div>
    </>
  );
}

interface MultiImageUploadProps {
  values: string[];
  onChange: (urls: string[]) => void;
  label?: string;
}

export function MultiImageUpload({ values, onChange, label = "Gallery Images" }: MultiImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const { uploadFile, isUploading, progress } = useUpload({
    basePath: `${BASE}/api/storage`,
    onSuccess: (res) => {
      onChange([...values, toServingUrl(res.objectPath)]);
    },
  });

  const openCrop = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const dataUrl = await readAsDataUrl(file);
    setPendingFile(file);
    setCropSrc(dataUrl);
  }, []);

  const handleCropConfirm = useCallback(async (blob: Blob) => {
    setCropSrc(null);
    const file = new File([blob], pendingFile?.name ?? "image.jpg", { type: "image/jpeg" });
    setPendingFile(null);
    await uploadFile(file);
  }, [pendingFile, uploadFile]);

  const handleCropSkip = useCallback(async () => {
    const file = pendingFile;
    setCropSrc(null);
    setPendingFile(null);
    if (file) await uploadFile(file);
  }, [pendingFile, uploadFile]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) openCrop(file);
    },
    [openCrop]
  );

  const remove = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <>
      {cropSrc && (
        <CropModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onSkip={handleCropSkip}
        />
      )}

      <div className="space-y-3">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</label>

        {values.length > 0 && (
          <div className="flex flex-wrap gap-2.5">
            {values.map((url, i) => (
              <div key={i} className="relative group w-20 h-20 bg-[#ddd5c8] overflow-hidden shrink-0">
                <img src={resolveImageUrl(url)} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
                <span className="absolute bottom-0.5 right-0.5 text-[8px] bg-background/70 px-1 leading-4">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
        )}

        <div
          onClick={() => !isUploading && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className={`flex items-center gap-3 border border-dashed cursor-pointer transition-colors px-4 py-4 ${
            isDragging ? "border-foreground bg-accent/50" : "border-border hover:border-foreground/40 hover:bg-accent/20"
          } ${isUploading ? "pointer-events-none" : ""}`}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1.5">
                  Uploading {progress}%
                </p>
                <div className="w-full h-0.5 bg-border overflow-hidden">
                  <div className="h-full bg-foreground transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </>
          ) : (
            <>
              <ImagePlus className="h-4 w-4 text-muted-foreground/50 shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
                  Add image
                </p>
                <p className="text-[9px] text-muted-foreground/60 mt-0.5">JPG · PNG · WEBP</p>
              </div>
            </>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) openCrop(f); e.target.value = ""; }}
        />
      </div>
    </>
  );
}
