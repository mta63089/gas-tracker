import { Button } from "#components/ui/button";
import { AppHeader } from "../../components/layout/app-header";
import { dateKey, type FuelEntry, type Member } from "../../lib/tracker";
import { ActivityHistory } from "./activity-history";
import { CalendarOverview } from "./calendar-overview";
import { DaySheet } from "./day-sheet";
import { LegacyImport } from "./legacy-import";
import { MemberSummary } from "./member-summary";
import { PresetManager } from "./preset-manager";
import {
  selectDayCounts,
  selectMemberStats,
  selectPeriodEntries,
  selectTotals,
  sortEntries,
} from "./selectors";
import {
  DeleteEntryDialog,
  EntryDialog,
  SettingsDialog,
} from "./tracker-dialogs";
import { useTracker } from "./use-tracker";

/** Composes the tracker UI while useTracker owns state and mutations. */
type Props = { member: Member; onSignOut: () => void };

export function TrackerDashboard({ member, onSignOut }: Props) {
  const tracker = useTracker(member);
  const {
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
  } = tracker;

  const allPurchases = entries.filter(
    (entry): entry is FuelEntry => entry.type === "fuel",
  );
  const selectedKey = dateKey(selectedDate);
  const monthKey = dateKey(calendarMonth).slice(0, 7);
  const periodEntries = selectPeriodEntries(entries, period, monthKey);
  const totals = selectTotals(periodEntries, allPurchases, fallbackPrice);
  const members = selectMemberStats(periodEntries, allPurchases, fallbackPrice);
  const dayCounts = selectDayCounts(entries);
  const dayEntries = sortEntries(
    entries.filter((entry) => entry.date === selectedKey),
  );
  const historyEntries = sortEntries(
    periodEntries.filter(
      (entry) => activityFilter === "all" || entry.type === activityFilter,
    ),
  );

  return (
    <div className='min-h-screen bg-background text-foreground'>
      <AppHeader
        currentUser={currentUser}
        onOpenPresets={() => tracker.setPresetsOpen(true)}
        onOpenSettings={() => tracker.setSettingsOpen(true)}
        onSignOut={onSignOut}
      />

      <main className='mx-auto max-w-6xl space-y-7 px-4 py-6 sm:px-6'>
        {tracker.error && (
          <div
            role='alert'
            className='flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4'
          >
            <p className='text-sm text-foreground'>{tracker.error}</p>
            <Button
              variant='outline'
              size='sm'
              onClick={() => void tracker.refresh().catch(() => {})}
            >
              Refresh data
            </Button>
          </div>
        )}
        {!tracker.ready ? (
          <p className='py-10 text-center text-sm text-muted-foreground'>
            {tracker.error
              ? "Unable to load shared records. Use Refresh data above."
              : "Loading shared records..."}
          </p>
        ) : (
          <>
            <LegacyImport
              counts={tracker.legacy}
              onImport={tracker.importFromBrowser}
            />
            <CalendarOverview
              month={calendarMonth}
              selectedDate={selectedDate}
              dayCounts={dayCounts}
              totals={totals}
              period={period}
              onPeriodChange={tracker.setPeriod}
              onMonthChange={tracker.setCalendarMonth}
              onDayClick={tracker.showDay}
              onAddTrip={() => tracker.openEntry("drive", dateKey(new Date()))}
              onAddFuel={() => tracker.openEntry("fuel", dateKey(new Date()))}
            />

            <MemberSummary members={members} />

            <ActivityHistory
              entries={historyEntries}
              purchases={allPurchases}
              fallbackPrice={fallbackPrice}
              filter={activityFilter}
              onFilterChange={tracker.setActivityFilter}
              onEdit={tracker.editEntry}
              onDelete={tracker.setPendingDelete}
            />
          </>
        )}
      </main>

      {tracker.ready && (
        <DaySheet
          open={dayOpen}
          onOpenChange={tracker.setDayOpen}
          date={selectedDate}
          entries={dayEntries}
          presets={presets}
          purchases={allPurchases}
          fallbackPrice={fallbackPrice}
          onQuickAdd={tracker.quickAdd}
          onManagePresets={tracker.openPresetsFromDay}
          onAddTrip={() => tracker.openEntry("drive")}
          onAddFuel={() => tracker.openEntry("fuel")}
          onEdit={tracker.editEntry}
          onDelete={tracker.setPendingDelete}
        />
      )}

      {tracker.ready && (
        <EntryDialog
          editor={editor}
          currentUser={currentUser}
          purchases={allPurchases}
          fallbackPrice={fallbackPrice}
          onOpenChange={(open) => {
            if (!open) tracker.setEditor(null);
          }}
          onSave={tracker.saveEntry}
        />
      )}

      {tracker.ready && (
        <PresetManager
          open={presetsOpen}
          onOpenChange={tracker.setPresetsOpen}
          presets={presets}
          onSave={tracker.savePreset}
          onDelete={tracker.deletePreset}
        />
      )}

      {tracker.ready && settingsOpen && (
        <SettingsDialog
          open={settingsOpen}
          fallbackPrice={fallbackPrice}
          onOpenChange={tracker.setSettingsOpen}
          onSave={tracker.saveFallbackPrice}
        />
      )}

      {tracker.ready && (
        <DeleteEntryDialog
          entry={pendingDelete}
          onOpenChange={(open) => {
            if (!open) tracker.setPendingDelete(null);
          }}
          onConfirm={tracker.deleteEntry}
        />
      )}
    </div>
  );
}
