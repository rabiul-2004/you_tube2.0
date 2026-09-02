import { formatDistanceToNow } from "date-fns";

export function formatDuration(seconds: number | null) {
  if (seconds === null || !isFinite(seconds) || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function safeDate(value: any): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export function relativeTime(value: any): string | null {
  const d = safeDate(value);
  if (!d) return null;
  return `${formatDistanceToNow(d)} ago`;
}

export function formatChatTime(iso: string): string {
  const d = safeDate(iso);
  if (!d) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
