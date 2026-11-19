import { supabase } from "../../lib/supabase";
import {
  DEFAULT_FALLBACK_PRICE,
  loadEntries,
  loadPresets,
  type Entry,
  type TripPreset,
} from "../../lib/tracker";

const PAGE_SIZE = 500;
const IMPORT_KEY = "gas-tracker-legacy-imported-v1";

type EntryRow = {
  id: string;
  date: string;
  created_at: string;
  created_by: "Mike" | "Mom";
  type: "drive" | "fuel";
  driver: "Mike" | "Mom" | null;
  miles: number | null;
  purpose: string | null;
  payer: "Mike" | "Mom" | null;
  amount: number | null;
  price_per_gallon: number | null;
};

type PresetRow = {
  id: string;
  name: string;
  miles: number;
  default_driver: "Mike" | "Mom" | null;
};

function toEntry(row: EntryRow): Entry {
  const common = {
    id: row.id,
    date: row.date,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };

  return row.type === "drive"
    ? {
        ...common,
        type: "drive",
        driver: row.driver!,
        miles: Number(row.miles),
        purpose: row.purpose!,
      }
    : {
        ...common,
        type: "fuel",
        payer: row.payer!,
        amount: Number(row.amount),
        pricePerGallon: Number(row.price_per_gallon),
      };
}

function fromEntry(entry: Entry): EntryRow {
  return {
    id: entry.id,
    date: entry.date,
    created_at: entry.createdAt,
    created_by: entry.createdBy,
    type: entry.type,
    driver: entry.type === "drive" ? entry.driver : null,
    miles: entry.type === "drive" ? entry.miles : null,
    purpose: entry.type === "drive" ? entry.purpose : null,
    payer: entry.type === "fuel" ? entry.payer : null,
    amount: entry.type === "fuel" ? entry.amount : null,
    price_per_gallon: entry.type === "fuel" ? entry.pricePerGallon : null,
  };
}

function toPreset(row: PresetRow): TripPreset {
  return {
    id: row.id,
    name: row.name,
    miles: Number(row.miles),
    defaultDriver: row.default_driver,
  };
}

function fromPreset(preset: TripPreset): PresetRow {
  return {
    id: preset.id,
    name: preset.name,
    miles: preset.miles,
    default_driver: preset.defaultDriver,
  };
}

async function listEntries(): Promise<Entry[]> {
  const entries: Entry[] = [];
  // The Supabase REST API has a default row limit; paginate instead of
  // silently dropping old history once the household has >1,000 entries.
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("tracker_entries")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []) as EntryRow[];
    entries.push(...page.map(toEntry));
    if (page.length < PAGE_SIZE) break;
  }
  return entries;
}

export async function fetchTrackerSnapshot() {
  const [entries, presetsResult, settingsResult] = await Promise.all([
    listEntries(),
    supabase.from("tracker_presets").select("*"),
    supabase.from("tracker_settings").select("fallback_price").eq("id", 1).single(),
  ]);

  if (presetsResult.error) throw presetsResult.error;
  if (settingsResult.error) throw settingsResult.error;

  return {
    entries,
    presets: ((presetsResult.data ?? []) as PresetRow[]).map(toPreset),
    fallbackPrice: Number(settingsResult.data?.fallback_price ?? DEFAULT_FALLBACK_PRICE),
  };
}

export async function saveRemoteEntry(entry: Entry): Promise<void> {
  const { error } = await supabase.from("tracker_entries").upsert(fromEntry(entry));
  if (error) throw error;
}

export async function deleteRemoteEntry(id: string): Promise<void> {
  const { error } = await supabase.from("tracker_entries").delete().eq("id", id);
  if (error) throw error;
}

export async function saveRemotePreset(preset: TripPreset): Promise<void> {
  const { error } = await supabase.from("tracker_presets").upsert(fromPreset(preset));
  if (error) throw error;
}

export async function deleteRemotePreset(id: string): Promise<void> {
  const { error } = await supabase.from("tracker_presets").delete().eq("id", id);
  if (error) throw error;
}

export async function saveRemotePrice(price: number): Promise<void> {
  const { data, error } = await supabase
    .from("tracker_settings")
    .update({ fallback_price: price })
    .eq("id", 1)
    .select("id")
    .single();
  if (error) throw error;
  if (!data) throw new Error("Could not update the shared fuel price.");
}

export function legacyImportCounts() {
  return {
    entries: loadEntries().length,
    presets: loadPresets().length,
    alreadyImported: localStorage.getItem(IMPORT_KEY) === "yes",
  };
}

export async function importLegacyData(): Promise<void> {
  // Merge rows by stable UUID. Import is repeatable if a network failure occurs.
  // Deliberately do not overwrite the shared fallback price from an old browser.
  const entries = loadEntries();
  const presets = loadPresets();
  for (let i = 0; i < entries.length; i += PAGE_SIZE) {
    const { error } = await supabase.from("tracker_entries")
      .upsert(entries.slice(i, i + PAGE_SIZE).map(fromEntry), { onConflict: "id", ignoreDuplicates: true });
    if (error) throw error;
  }
  for (let i = 0; i < presets.length; i += PAGE_SIZE) {
    const { error } = await supabase.from("tracker_presets")
      .upsert(presets.slice(i, i + PAGE_SIZE).map(fromPreset), { onConflict: "id", ignoreDuplicates: true });
    if (error) throw error;
  }
  // Keep the original localStorage backup; it is never deleted automatically.
  localStorage.setItem(IMPORT_KEY, "yes");
}
