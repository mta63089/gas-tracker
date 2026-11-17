export const VEHICLE = {
  name: "2025 Kia Sportage AWD",
  mpg: 25,
} as const;

export const MEMBERS = ["Mike", "Mom"] as const;

export type Member = (typeof MEMBERS)[number];

type EntryBase = {
  id: string;
  date: string;
  createdAt: string;
  createdBy: Member;
};

export type DriveEntry = EntryBase & {
  type: "drive";
  driver: Member;
  miles: number;
  purpose: string;
};

export type FuelEntry = EntryBase & {
  type: "fuel";
  payer: Member;
  amount: number;
  pricePerGallon: number;
};

export type Entry = DriveEntry | FuelEntry;

const STORAGE_KEY = "gas-tracker-entries-v1";

export function loadEntries(): Entry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const data: unknown = JSON.parse(stored);
    return Array.isArray(data) ? (data as Entry[]) : [];
  } catch {
    return [];
  }
}

export function saveEntries(entries: Entry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function today() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function fuelGallons(entry: FuelEntry) {
  return entry.amount / entry.pricePerGallon;
}

export function estimatedMiles(entry: FuelEntry) {
  return fuelGallons(entry) * VEHICLE.mpg;
}

export function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function number(value: number, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(value);
}

export function displayDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
