import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isYesterday, isTomorrow, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return "₹0";
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    const lk = amount / 100000;
    return `₹${lk % 1 === 0 ? lk.toFixed(0) : lk.toFixed(1)} L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatBudgetRange(min?: number | null, max?: number | null): string {
  if (!min && !max) return "Not specified";
  if (min && max) {
    return `${formatPrice(min)} – ${formatPrice(max)}`;
  }
  if (min && !max) return `Min ${formatPrice(min)}`;
  if (!min && max) return `Up to ${formatPrice(max)}`;
  return "";
}

export function formatRelativeDate(dateString?: string | Date | null): string {
  if (!dateString) return "—";
  const date = typeof dateString === "string" ? parseISO(dateString) : dateString;
  if (isNaN(date.getTime())) return "—";

  if (isToday(date)) {
    return `Today at ${format(date, "h:mm a")}`;
  }
  if (isTomorrow(date)) {
    return `Tomorrow at ${format(date, "h:mm a")}`;
  }
  if (isYesterday(date)) {
    return `Yesterday at ${format(date, "h:mm a")}`;
  }
  return format(date, "MMM d, yyyy h:mm a");
}

export function formatDateOnly(dateString?: string | Date | null): string {
  if (!dateString) return "—";
  const date = typeof dateString === "string" ? parseISO(dateString) : dateString;
  if (isNaN(date.getTime())) return "—";
  return format(date, "MMM d, yyyy");
}

export function formatTimeOnly(dateString?: string | Date | null): string {
  if (!dateString) return "—";
  const date = typeof dateString === "string" ? parseISO(dateString) : dateString;
  if (isNaN(date.getTime())) return "—";
  return format(date, "h:mm a");
}
