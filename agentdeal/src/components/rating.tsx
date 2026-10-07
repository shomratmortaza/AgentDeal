import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Real average from buyer reviews; new sellers show "No reviews yet" instead of a made-up number. */
export function RatingBadge({ rating, count, className, long }: { rating: number | string; count: number; className?: string; long?: boolean }) {
  if (!count) return <span className={cn("inline-flex items-center gap-1 text-muted-foreground", className)}><Star className="size-3.5" />{long ? "No reviews yet" : "New"}</span>;
  return <span className={cn("inline-flex items-center gap-1", className)}><Star className="size-3.5 fill-current text-amber-400" /><strong className="font-semibold tabular-nums">{Number(rating).toFixed(1)}</strong><span className="text-muted-foreground">({count}{long ? ` review${count === 1 ? "" : "s"}` : ""})</span></span>;
}

export function Stars({ value, size = "size-4" }: { value: number; size?: string }) {
  return <span className="inline-flex" aria-label={`${value} out of 5 stars`}>{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={cn(size, n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />)}</span>;
}

export function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  const labels = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];
  return <div className="flex items-center gap-3"><div className="flex" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
    {[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onMouseEnter={() => setHover(n)} onClick={() => onChange(n)} className="p-0.5">
      <Star className={cn("size-7 transition-colors", n <= (hover || value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} /></button>)}
  </div><span className="text-sm text-muted-foreground">{labels[hover || value]}</span></div>;
}
