import { cn } from "@/lib/utils";

interface PlaceholderImageProps {
  label?: string;
  aspectRatio?: "video" | "portrait" | "square" | "tall";
  className?: string;
}

export function PlaceholderImage({ label = "Image", aspectRatio = "portrait", className }: PlaceholderImageProps) {
  return (
    <div 
      className={cn(
        "bg-accent w-full flex items-center justify-center relative overflow-hidden",
        {
          "aspect-video": aspectRatio === "video",
          "aspect-[3/4]": aspectRatio === "portrait",
          "aspect-square": aspectRatio === "square",
          "aspect-[2/3]": aspectRatio === "tall",
        },
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent mix-blend-overlay"></div>
      <span className="text-xs uppercase tracking-widest text-accent-foreground/50 font-medium">
        {label}
      </span>
    </div>
  );
}
