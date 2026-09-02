import { formatDuration } from "@/lib/videoUtils";

export default function DurationBadge({
  seconds,
  className = "",
}: {
  seconds: number | null | undefined;
  className?: string;
}) {
  const text = formatDuration(seconds ?? null);
  if (!text) return null;
  return (
    <div
      className={`absolute bg-black/80 text-white text-[11px] px-1 rounded font-medium ${className}`}
    >
      {text}
    </div>
  );
}