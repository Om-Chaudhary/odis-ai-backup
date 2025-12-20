import type { TimeOption } from "./types";

// Concurrency control - process 3 at a time to avoid overwhelming Vercel
export const BATCH_CONCURRENCY = 3;

// Generate time options from 6 AM to 9 PM in 30-minute intervals
export function generateTimeOptions(): TimeOption[] {
  const options: TimeOption[] = [];
  for (let hour = 6; hour <= 21; hour++) {
    for (const minute of [0, 30]) {
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      const label = new Date(`2000-01-01T${time}:00`).toLocaleTimeString(
        "en-US",
        { hour: "numeric", minute: "2-digit", hour12: true },
      );
      options.push({ value: time, label });
    }
  }
  return options;
}

export const TIME_OPTIONS = generateTimeOptions();
