import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Light: translucent-white controls on the red brand header. Dark: normal input surfaces.
export const ON_BRAND =
  "border-white/50 bg-white/15 text-white hover:bg-white/25 hover:text-white focus-visible:ring-white/70 " +
  "dark:border-input dark:bg-input/30 dark:text-foreground dark:hover:bg-input/50 dark:hover:text-foreground dark:focus-visible:ring-ring"
