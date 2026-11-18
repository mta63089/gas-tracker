import { PresetManager } from './preset-manager';
import { dateKey, type FuelEntry } from '../../lib/tracker';
import {
  selectDayCounts,
  selectMemberStats,
  selectPeriodEntries,
  selectTotals,
  sortEntries,
} from './selectors';
import { useTracker } from './use-tracker';
import { AppHeader } from '../../components/layout/app-header';
import { CalendarOverview } from './calendar-overview';
import { MemberSummary } from './member-summary';
import { ActivityHistory } from './activity-history';
import { DaySheet } from './day-sheet';
import {
  DeleteEntryDialog, EntryDialog, SettingsDialog,
} from './tracker-dialogs';

/** Composes the tracker UI while useTracker owns state and mutations. */
export function TrackerDashboard() {
  const tracker = useTracker();
  const {
    entries, presets, fallbackPrice, currentUser, calendarMonth,
    selectedDate, dayOpen, editor, presetsOpen, settingsOpen,
    pendingDelete, period, activityFilter,
  } = tracker;

  const allPurchases = entries.filter(
    (entry): entry is FuelEntry => entry.type === 'fuel',
  );
  const selectedKey = dateKey(selectedDate);
  const monthKey = dateKey(calendarMonth).slice(0, 7);
  const periodEntries = selectPeriodEntries(entries, period, monthKey);
  const totals = selectTotals(periodEntries, allPurchases, fallbackPrice);
  const members = selectMemberStats(periodEntries, allPurchases, fallbackPrice);
  const dayCounts = selectDayCounts(entries);
  const dayEntries = sortEntries(entries.filter((entry) => entry.date === selectedKey));
  const historyEntries = sortEntries(periodEntries.filter(
    (entry) => activityFilter === 'all' || entry.type === activityFilter,
  ));

  return (
    <div className='min-h-screen bg-background text-foreground'>
      <AppHeader
        currentUser={currentUser}
        onUserChange={tracker.setCurrentUser}
        onOpenPresets={() => tracker.setPresetsOpen(true)}
        onOpenSettings={() => tracker.setSettingsOpen(true)}
      />

      <main className='mx-auto max-w-6xl space-y-7 px-4 py-6 sm:px-6'>
        <CalendarOverview
          month={calendarMonth}
          selectedDate={selectedDate}
          dayCounts={dayCounts}
          totals={totals}
          period={period}
          onPeriodChange={tracker.setPeriod}
          onMonthChange={tracker.setCalendarMonth}
          onDayClick={tracker.showDay}
          onAddTrip={() => tracker.openEntry('drive', dateKey(new Date()))}
          onAddFuel={() => tracker.openEntry('fuel', dateKey(new Date()))}
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
      </main>

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
        onAddTrip={() => tracker.openEntry('drive')}
        onAddFuel={() => tracker.openEntry('fuel')}
        onEdit={tracker.editEntry}
        onDelete={tracker.setPendingDelete}
      />

      <EntryDialog
        editor={editor}
        currentUser={currentUser}
        purchases={allPurchases}
        fallbackPrice={fallbackPrice}
        onOpenChange={(open) => { if (!open) tracker.setEditor(null); }}
        onSave={tracker.saveEntry}
      />

      <PresetManager
        open={presetsOpen}
        onOpenChange={tracker.setPresetsOpen}
        presets={presets}
        onSave={tracker.savePreset}
        onDelete={tracker.deletePreset}
      />

      {settingsOpen && (
        <SettingsDialog
          open={settingsOpen}
          fallbackPrice={fallbackPrice}
          onOpenChange={tracker.setSettingsOpen}
          onSave={tracker.setFallbackPrice}
        />
      )}

      <DeleteEntryDialog
        entry={pendingDelete}
        onOpenChange={(open) => { if (!open) tracker.setPendingDelete(null); }}
        onConfirm={tracker.deleteEntry}
      />
    </div>
  );
}
