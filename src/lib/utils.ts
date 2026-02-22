import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getPlural(singular: string, plural: string, count: number) {
  return count === 1 ? singular : plural;
}
