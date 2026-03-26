"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface DiffProps {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt?: string;
  afterAlt?: string;
  beforeLabel?: string;
  afterLabel?: string;
  defaultPosition?: number;
  className?: string;
}

export function Diff({
  beforeSrc,
  afterSrc,
  beforeAlt = "Before",
  afterAlt = "After",
  beforeLabel,
  afterLabel,
  defaultPosition = 0.5,
  className,
}: DiffProps) {
  const [position, setPosition] = useState(defaultPosition);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const p = Math.max(0, Math.min(1, x / rect.width));
    setPosition(p);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      isDraggingRef.current = true;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      updatePosition(clientX);
    },
    [updatePosition],
  );

  const handlePointerMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      updatePosition(clientX);
    },
    [updatePosition],
  );

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
    window.removeEventListener("mousemove", handlePointerMove);
    window.removeEventListener("mouseup", handlePointerUp);
    window.removeEventListener("touchmove", handlePointerMove, {
      capture: true,
    });
    window.removeEventListener("touchend", handlePointerUp, { capture: true });
  }, [handlePointerMove]);

  const startDrag = useCallback(() => {
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    window.addEventListener("touchmove", handlePointerMove, { capture: true });
    window.addEventListener("touchend", handlePointerUp, { capture: true });
  }, [handlePointerMove, handlePointerUp]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      handlePointerDown(e);
      startDrag();
    },
    [handlePointerDown, startDrag],
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      handlePointerDown(e);
      startDrag();
    },
    [handlePointerDown, startDrag],
  );

  const positionPercent = position * 100;

  return (
    <figure
      ref={containerRef}
      className={cn(
        "relative overflow-hidden select-none rounded-xl border border-border bg-muted/20 aspect-video w-full md:w-80 xl:w-96 h-max drop-shadow-md",
        className,
      )}
      role="img"
      aria-label={`Before and after comparison: ${beforeAlt} and ${afterAlt}`}
    >
      {/* After image (full width, right side) */}
      <div className="absolute inset-0">
        <img
          src={afterSrc}
          alt={afterAlt}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
          draggable={false}
        />
      </div>

      {/* Before image: full container size, only visibility changes with slider */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: `inset(0 ${100 - positionPercent}% 0 0)`,
        }}
      >
        <img
          src={beforeSrc}
          alt={beforeAlt}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
          draggable={false}
        />
      </div>

      {/* Resizer handle */}
      <div
        className="absolute top-0 bottom-0 z-10 w-0.5 cursor-ew-resize touch-none bg-background"
        style={{ left: `${positionPercent}%`, transform: "translateX(-50%)" }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        role="slider"
        aria-valuenow={Math.round(position * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Compare before and after"
        tabIndex={0}
      >
        <div className="absolute left-1/2 top-1/2 h-6 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-1 border-border bg-background shadow-md ring-1" />
      </div>

      {/* Optional labels */}
      {beforeLabel && (
        <span
          className="absolute left-2 top-2 rounded bg-background/90 px-2 py-1 text-xs font-medium text-foreground"
          aria-hidden
        >
          {beforeLabel}
        </span>
      )}
      {afterLabel && (
        <span
          className="absolute right-2 top-2 rounded bg-background/90 px-2 py-1 text-xs font-medium text-foreground"
          aria-hidden
        >
          {afterLabel}
        </span>
      )}
    </figure>
  );
}
