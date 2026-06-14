import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { ZoomIn, ZoomOut } from "lucide-react";

// Neutral background used both in the preview and the saved canvas output
const BG_COLOR = "#f0ebe3";

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = new Image();
  // Required for cross-origin images so canvas is not tainted
  image.crossOrigin = "anonymous";

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => {
      // Retry without crossOrigin (e.g. same-origin object URLs)
      const img2 = new Image();
      img2.onload = () => {
        Object.assign(image, img2);
        resolve();
      };
      img2.onerror = () => reject(new Error("Image load error"));
      img2.src = imageSrc;
    };
    image.src = imageSrc;
  });

  const w = Math.round(pixelCrop.width);
  const h = Math.round(pixelCrop.height);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  // Fill with the same neutral background shown in the preview — no black bars
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, w, h);

  // Clamp source coords to actual image bounds to handle "contain" letterboxing
  const srcX = Math.max(0, Math.round(pixelCrop.x));
  const srcY = Math.max(0, Math.round(pixelCrop.y));
  const srcRight = Math.min(image.naturalWidth, Math.round(pixelCrop.x + pixelCrop.width));
  const srcBottom = Math.min(image.naturalHeight, Math.round(pixelCrop.y + pixelCrop.height));
  const srcW = srcRight - srcX;
  const srcH = srcBottom - srcY;
  // Destination offset when crop origin is outside the image (e.g. left of image)
  const dstX = Math.max(0, Math.round(-pixelCrop.x));
  const dstY = Math.max(0, Math.round(-pixelCrop.y));

  if (srcW > 0 && srcH > 0) {
    ctx.drawImage(image, srcX, srcY, srcW, srcH, dstX, dstY, srcW, srcH);
  }

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

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

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
    <div
      className="fixed inset-0 z-[700] flex flex-col select-none"
      style={{
        backgroundColor: "#1a1a1a",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 shrink-0">
        <p className="text-[10px] tracking-[0.35em] uppercase text-white/50">
          Crop Image
        </p>
        <p className="text-[9px] text-white/30 tracking-wide hidden sm:block">
          Drag · Pinch or slider to zoom
        </p>
      </div>

      {/* Cropper — "contain" keeps the full product visible; background matches saved output */}
      <div className="relative flex-1 overflow-hidden">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={3 / 4}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
          objectFit="contain"
          minZoom={1}
          maxZoom={4}
          zoomSpeed={0.4}
          style={{
            containerStyle: { backgroundColor: BG_COLOR },
            cropAreaStyle: {
              border: "2px solid rgba(255,255,255,0.6)",
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.65)",
            },
          }}
        />
      </div>

      {/* Zoom slider */}
      <div className="px-6 py-3 flex items-center gap-4 shrink-0">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))}
          className="text-white/40 hover:text-white/70 transition-colors p-1"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <input
          type="range"
          min={1}
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

      {/* Action buttons */}
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
