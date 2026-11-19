import { startOfMonth } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";

import { supabase } from "../../lib/supabase";
import {
  dateKey,
  DEFAULT_FALLBACK_PRICE,
  type Entry,
  type Member,
  type TripPreset,
} from "../../lib/tracker";
import type { EditorState } from "./entry-form";
import {
  deleteRemoteEntry,
  deleteRemotePreset,
  fetchTrackerSnapshot,
  importLegacyData,
  legacyImportCounts,
  saveRemoteEntry,
  saveRemotePreset,
  saveRemotePrice,
} from "./remote-store";
import type { ActivityFilter, Period } from "./selectors";

function errorMessage(cause: unknown): string {
  return cause instanceof Error
    ? cause.message
    : "Could not save changes to Supabase.";
}

/** Shared cloud data and local-only UI state. No persistence writes in an effect. */
export function useTracker(currentUser: Member) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [presets, setPresets] = useState<TripPreset[]>([]);
  const [fallbackPrice, setFallbackPrice] = useState(DEFAULT_FALLBACK_PRICE);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [legacy, setLegacy] = useState(legacyImportCounts);
  const requestNumber = useRef(0);
  const active = useRef(true);

  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dayOpen, setDayOpen] = useState(false);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Entry | null>(null);
  const [period, setPeriod] = useState<Period>("month");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");

  const refresh = useCallback(async () => {
    const request = ++requestNumber.current;
    try {
      const next = await fetchTrackerSnapshot();
      if (!active.current || request !== requestNumber.current) return;
      setEntries(next.entries);
      setPresets(next.presets);
      setFallbackPrice(next.fallbackPrice);
      setError(null);
      setReady(true);
      setLoading(false);
    } catch (cause) {
      if (active.current && request === requestNumber.current) {
        setError(errorMessage(cause));
        setLoading(false);
      }
      throw cause;
    }
  }, []);

  useEffect(() => {
    active.current = true;
    void refresh().catch(() => {});

    // Subscribe to changes from the other device. Refetch instead of applying
    // individual events so all clients use the same mapping and calculations.
    const channel = supabase
      .channel("gas-tracker-data")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tracker_entries" },
        () => {
          void refresh().catch(() => {});
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tracker_presets" },
        () => {
          void refresh().catch(() => {});
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tracker_settings" },
        () => {
          void refresh().catch(() => {});
        },
      )
      .subscribe();

    return () => {
      active.current = false;
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  async function commit(write: () => Promise<void>): Promise<boolean> {
    try {
      setError(null);
      await write();
      await refresh();
      return true;
    } catch (cause) {
      if (active.current) setError(errorMessage(cause));
      return false;
    }
  }

  async function saveEntry(entry: Entry) {
    if (await commit(() => saveRemoteEntry(entry))) setEditor(null);
  }

  async function quickAdd(preset: TripPreset) {
    await commit(() =>
      saveRemoteEntry({
        id: crypto.randomUUID(),
        date: dateKey(selectedDate),
        createdAt: new Date().toISOString(),
        createdBy: currentUser,
        type: "drive",
        driver: preset.defaultDriver ?? currentUser,
        miles: preset.miles,
        purpose: preset.name,
      }),
    );
  }

  function openEntry(type: "drive" | "fuel", date = dateKey(selectedDate)) {
    setDayOpen(false);
    setEditor({ type, date });
  }

  function editEntry(entry: Entry) {
    setDayOpen(false);
    setEditor(
      entry.type === "drive"
        ? { type: "drive", entry }
        : { type: "fuel", entry },
    );
  }

  async function deleteEntry() {
    if (!pendingDelete) return;
    if (await commit(() => deleteRemoteEntry(pendingDelete.id)))
      setPendingDelete(null);
  }

  async function savePreset(preset: TripPreset) {
    await commit(() => saveRemotePreset(preset));
  }

  async function deletePreset(id: string) {
    await commit(() => deleteRemotePreset(id));
  }

  async function saveFallbackPrice(price: number): Promise<boolean> {
    return commit(() => saveRemotePrice(price));
  }

  async function importFromBrowser(): Promise<boolean> {
    const succeeded = await commit(importLegacyData);
    if (succeeded) setLegacy(legacyImportCounts());
    return succeeded;
  }

  function showDay(date: Date) {
    setSelectedDate(date);
    setDayOpen(true);
  }

  function openPresetsFromDay() {
    setDayOpen(false);
    setPresetsOpen(true);
  }

  return {
    entries,
    presets,
    fallbackPrice,
    currentUser,
    calendarMonth,
    selectedDate,
    dayOpen,
    editor,
    presetsOpen,
    settingsOpen,
    pendingDelete,
    period,
    activityFilter,
    loading,
    ready,
    error,
    legacy,
    setCalendarMonth,
    setSelectedDate,
    setDayOpen,
    setEditor,
    setPresetsOpen,
    setSettingsOpen,
    setPendingDelete,
    setPeriod,
    setActivityFilter,
    saveEntry,
    quickAdd,
    openEntry,
    editEntry,
    deleteEntry,
    savePreset,
    deletePreset,
    saveFallbackPrice,
    importFromBrowser,
    refresh,
    showDay,
    openPresetsFromDay,
  };
}
