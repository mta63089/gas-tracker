export const VEHICLE = {
  name: "2025 Kia Sportage AWD",
  mpg: 25,
} as const;

export const MEMBERS = ["Mike", "Mom"] as const;
export type Member = (typeof MEMBERS)[number];

type EntryBase = {
  id: string;
  date: string; // YYYY-MM-DD, local calendar date
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

export type TripPreset = {
  id: string;
  name: string;
  miles: number;
  defaultDriver: Member | null;
};

const ENTRY_KEY = "gas-tracker-entries-v1";
const PRESET_KEY = "gas-tracker-presets-v1";
const FALLBACK_PRICE_KEY = "gas-tracker-fallback-price-v1";
export const DEFAULT_FALLBACK_PRICE = 3.25;

export function loadEntries(): Entry[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(ENTRY_KEY) ?? "[]");
    return Array.isArray(data) ? (data as Entry[]) : [];
  } catch {
    return [];
  }
}

export function saveEntries(entries: Entry[]) {
  localStorage.setItem(ENTRY_KEY, JSON.stringify(entries));
}

export function loadPresets(): TripPreset[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(PRESET_KEY) ?? "[]");
    return Array.isArray(data) ? (data as TripPreset[]) : [];
  } catch {
    return [];
  }
}

export function savePresets(presets: TripPreset[]) {
  localStorage.setItem(PRESET_KEY, JSON.stringify(presets));
}

export function loadFallbackPrice(): number {
  const parsed = Number(localStorage.getItem(FALLBACK_PRICE_KEY));
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_FALLBACK_PRICE;
}

export function saveFallbackPrice(value: number) {
  localStorage.setItem(FALLBACK_PRICE_KEY, String(value));
}

export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const today = () => dateKey(new Date());
export const parseDate = (date: string) => new Date(`${date}T12:00:00`);

export function fuelGallons(entry: FuelEntry) {
  return entry.amount / entry.pricePerGallon;
}

export function estimatedMiles(entry: FuelEntry) {
  return fuelGallons(entry) * VEHICLE.mpg;
}

export function estimateTripCost(
  drive: Pick<DriveEntry, "date" | "miles">,
  purchases: FuelEntry[],
  fallbackPrice: number,
) {
  // Use the latest fuel price recorded on or before the drive's date.
  const applicable = purchases
    .filter(
      (purchase) => purchase.date <= drive.date && purchase.pricePerGallon > 0,
    )
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
    )[0];

  const pricePerGallon = applicable?.pricePerGallon ?? fallbackPrice;
  return {
    pricePerGallon,
    gallons: drive.miles / VEHICLE.mpg,
    cost: (drive.miles / VEHICLE.mpg) * pricePerGallon,
    source: applicable ? ("purchase" as const) : ("fallback" as const),
  };
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
  return parseDate(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
