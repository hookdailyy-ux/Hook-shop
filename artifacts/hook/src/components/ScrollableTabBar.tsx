import { useRef, useState, useEffect, useCallback, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  children: ReactNode;
  className?: string;
}

export function ScrollableTabBar({ children, className }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [update]);

  const scrollBy = (dir: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: dir * 220, behavior: "smooth" });
  };

  return (
    <div className={`relative flex-1 min-w-0 flex items-stretch ${className ?? ""}`}>
      {canScrollLeft && (
        <button
          onClick={() => scrollBy(-1)}
          className="absolute left-0 top-0 bottom-0 z-10 w-8 flex items-center justify-start pl-1 bg-gradient-to-r from-background to-transparent"
          aria-label="Scroll tabs left"
          tabIndex={-1}
        >
          <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
        </button>
      )}

      <div
        ref={scrollRef}
        className={`no-scrollbar flex items-center overflow-x-auto w-full ${canScrollLeft ? "pl-6" : ""} ${canScrollRight ? "pr-6" : ""}`}
      >
        {children}
      </div>

      {canScrollRight && (
        <button
          onClick={() => scrollBy(1)}
          className="absolute right-0 top-0 bottom-0 z-10 w-8 flex items-center justify-end pr-1 bg-gradient-to-l from-background to-transparent"
          aria-label="Scroll tabs right"
          tabIndex={-1}
        >
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
