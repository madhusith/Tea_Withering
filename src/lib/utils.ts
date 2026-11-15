import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculates wet-bulb depression:
 * Depression = Dry Temperature - Wet Temperature
 */
export function calculateDepression(
  dryTemp: number | null | undefined,
  wetTemp: number | null | undefined
): number | null {
  if (dryTemp === null || dryTemp === undefined || wetTemp === null || wetTemp === undefined) {
    return null;
  }
  return Math.round((dryTemp - wetTemp) * 10) / 10;
}

