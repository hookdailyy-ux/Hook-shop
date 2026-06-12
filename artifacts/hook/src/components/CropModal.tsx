import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { ZoomIn, ZoomOut } from "lucide-react";

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Image load error"));
  });

  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      },
      "image/jpeg",
      0.92,
    );
  });
}

interface CropModalProps {
  imageSrc: string;
  onConfirm: (blob: Blob) => void;
  onSkip: () => void;
}

export function CropModal({ imageSrc, onConfirm, onSkip }: CropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onConfirm(blob);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[700] bg-black/95 flex flex-col select-none">
      <div className="flex items-center justify-between px-6 py-4 shrink-0">
        <p className="text-[10px] tracking-[0.35em] uppercase text-white/50">Crop Image</p>
        <p className="text-[9px] text-white/30 tracking-wide hidden sm:block">
          Drag to reposition · Scroll or pinch to zoom
        </p>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
          style={{
            containerStyle: { backgroundColor: "transparent" },
            cropAreaStyle: {
              border: "1px solid rgba(255,255,255,0.35)",
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
            },
          }}
          minZoom={0.4}
          maxZoom={4}
          zoomSpeed={0.3}
          objectFit="contain"
        />
      </div>

      <div className="px-6 py-3 flex items-center gap-4 shrink-0">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.1).toFixed(2)))}
          className="text-white/40 hover:text-white/70 transition-colors p-1"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <input
          type="range"
          min={0.4}
          max={4}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 accent-white cursor-pointer"
          aria-label="Zoom"
        />
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(4, +(z + 0.1).toFixed(2)))}
          className="text-white/40 hover:text-white/70 transition-colors p-1"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-3 px-6 py-5 border-t border-white/10 shrink-0">
        <button
          type="button"
          onClick={onSkip}
          className="flex-1 py-3.5 border border-white/20 text-white/60 text-[10px] tracking-[0.3em] uppercase hover:bg-white/5 transition-colors"
        >
          Use Original
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isProcessing || !croppedAreaPixels}
          className="flex-1 py-3.5 bg-white text-black text-[10px] tracking-[0.3em] uppercase hover:bg-white/90 transition-colors disabled:opacity-40"
        >
          {isProcessing ? "Processing…" : "Crop & Save"}
        </button>
      </div>
    </div>
  );
}
