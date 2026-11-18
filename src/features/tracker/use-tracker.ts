import { startOfMonth } from "date-fns";
import { useEffect, useState } from "react";

import { type EditorState } from "./entry-form";
import {
  dateKey,
  loadEntries,
  loadFallbackPrice,
  loadPresets,
  saveEntries,
  saveFallbackPrice,
  savePresets,
  type Entry,
  type Member,
  type TripPreset,
} from "../../lib/tracker";
import { type ActivityFilter, type Period } from "./selectors";

/** Owns the tracker data and UI state. No JSX or presentation logic. */
export function useTracker() {
  const [entries, setEntries] = useState<Entry[]>(loadEntries);
  const [presets, setPresets] = useState<TripPreset[]>(loadPresets);
  const [fallbackPrice, setFallbackPrice] = useState(loadFallbackPrice);
  const [currentUser, setCurrentUser] = useState<Member>("Mike");

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

  useEffect(() => saveEntries(entries), [entries]);
  useEffect(() => savePresets(presets), [presets]);
  useEffect(() => saveFallbackPrice(fallbackPrice), [fallbackPrice]);

  function saveEntry(entry: Entry) {
    setEntries((current) =>
      current.some((item) => item.id === entry.id)
        ? current.map((item) => (item.id === entry.id ? entry : item))
        : [...current, entry],
    );
    setEditor(null);
  }

  function quickAdd(preset: TripPreset) {
    saveEntry({
      id: crypto.randomUUID(),
      date: dateKey(selectedDate),
      createdAt: new Date().toISOString(),
      createdBy: currentUser,
      type: "drive",
      driver: preset.defaultDriver ?? currentUser,
      miles: preset.miles,
      purpose: preset.name,
    });
    // Day sheet remains open to show the new trip immediately.
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

  function deleteEntry() {
    if (!pendingDelete) return;
    setEntries((current) =>
      current.filter((entry) => entry.id !== pendingDelete.id),
    );
    setPendingDelete(null);
  }

  function savePreset(preset: TripPreset) {
    setPresets((current) =>
      current.some((item) => item.id === preset.id)
        ? current.map((item) => (item.id === preset.id ? preset : item))
        : [...current, preset],
    );
  }

  function deletePreset(id: string) {
    setPresets((current) => current.filter((item) => item.id !== id));
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
    entries, presets, fallbackPrice, currentUser, calendarMonth,
    selectedDate, dayOpen, editor, presetsOpen, settingsOpen,
    pendingDelete, period, activityFilter,
    setFallbackPrice, setCurrentUser, setCalendarMonth, setSelectedDate,
    setDayOpen, setEditor, setPresetsOpen, setSettingsOpen,
    setPendingDelete, setPeriod, setActivityFilter,
    saveEntry, quickAdd, openEntry, editEntry, deleteEntry,
    savePreset, deletePreset, showDay, openPresetsFromDay,
  };
}
