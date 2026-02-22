import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getPlural(singular: string, plural: string, count: number) {
  return count === 1 ? singular : plural;
}

// 12 colors evenly spaced across the hue wheel, chosen to be visually distinct.
const MODEL_COLORS = [
  "#e53e3e", // red
  "#3182ce", // blue
  "#38a169", // green
  "#d69e2e", // yellow
  "#805ad5", // purple
  "#dd6b20", // orange
  "#319795", // teal
  "#d53f8c", // pink
  "#2b6cb0", // dark blue
  "#276749", // dark green
  "#b7791f", // dark yellow
  "#6b46c1", // dark purple
];

/** Returns a consistent color for a given model name across all charts. */
export function getModelColor(model: string): string {
  // FNV-1a: XOR before multiply gives strong avalanche from the first differing char,
  // which matters for models sharing a long common prefix (e.g. "gpt-5-nano" vs "gpt-5-mini").
  let hash = 0x811c9dc5;
  for (let i = 0; i < model.length; i++) {
    hash = Math.imul(hash ^ model.charCodeAt(i), 0x01000193) >>> 0;
  }
  return MODEL_COLORS[hash % MODEL_COLORS.length];
}
