import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "#components/ui/alert-dialog";
import { Badge } from "#components/ui/badge";
import { Button } from "#components/ui/button";
import { Calendar, CalendarDayButton } from "#components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "#components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "#components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "#components/ui/field";
import { Input } from "#components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "#components/ui/sheet";
import { format, startOfMonth } from "date-fns";
import { useEffect, useState, type FormEvent } from "react";

import { ThemeSwitch } from "#components/theme-switch";
import { EntryForm, type EditorState } from "./components/entry-form";
import { PresetManager } from "./components/preset-manager";
import {
  MEMBERS,
  VEHICLE,
  currency,
  dateKey,
  displayDate,
  estimateTripCost,
  estimatedMiles,
  fuelGallons,
  loadEntries,
  loadFallbackPrice,
  loadPresets,
  number,
  saveEntries,
  saveFallbackPrice,
  savePresets,
  type DriveEntry,
  type Entry,
  type FuelEntry,
  type Member,
  type TripPreset,
} from "./lib/tracker";

type ActivityFilter = "all" | "drive" | "fuel";
type Period = "month" | "all";

type ActivityRowProps = {
  entry: Entry;
  purchases: FuelEntry[];
  fallbackPrice: number;
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
};

function ActivityRow({
  entry,
  purchases,
  fallbackPrice,
  onEdit,
  onDelete,
}: ActivityRowProps) {
  const estimate =
    entry.type === "drive"
      ? estimateTripCost(entry, purchases, fallbackPrice)
      : null;

  return (
    <div className='flex flex-wrap items-center justify-between gap-3 border-b py-4 last:border-b-0'>
      <div className='min-w-0 space-y-1'>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge variant={entry.type === "drive" ? "secondary" : "outline"}>
            {entry.type === "drive" ? "Trip" : "Fuel"}
          </Badge>
          <p className='font-medium'>
            {entry.type === "drive" ? entry.purpose : "Gas purchase"}
          </p>
        </div>
        <p className='text-xs text-muted-foreground'>
          {displayDate(entry.date)} ·{" "}
          {entry.type === "drive" ? entry.driver : entry.payer}
        </p>
        <p className='text-xs text-muted-foreground'>
          {entry.type === "drive"
            ? `${number(entry.miles, 1)} mi · ${currency(estimate!.cost)} estimated fuel cost${estimate!.source === "fallback" ? " (default price)" : ""}`
            : `${number(fuelGallons(entry), 2)} gal · ${number(estimatedMiles(entry))} mi estimated range · $${entry.pricePerGallon.toFixed(3)}/gal`}
        </p>
      </div>
      <div className='flex items-center gap-1'>
        <p className='mr-2 font-semibold'>
          {entry.type === "drive"
            ? `${number(entry.miles, 1)} mi`
            : currency(entry.amount)}
        </p>
        <Button size='sm' variant='outline' onClick={() => onEdit(entry)}>
          Edit
        </Button>
        <Button size='sm' variant='destructive' onClick={() => onDelete(entry)}>
          Delete
        </Button>
      </div>
    </div>
  );
}

function App() {
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
  const [priceDraft, setPriceDraft] = useState(String(fallbackPrice));
  const [priceError, setPriceError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Entry | null>(null);
  const [period, setPeriod] = useState<Period>("month");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");

  useEffect(() => saveEntries(entries), [entries]);
  useEffect(() => savePresets(presets), [presets]);
  useEffect(() => saveFallbackPrice(fallbackPrice), [fallbackPrice]);

  const allPurchases = entries.filter(
    (entry): entry is FuelEntry => entry.type === "fuel",
  );
  const monthKey = dateKey(calendarMonth).slice(0, 7);
  const selectedKey = dateKey(selectedDate);

  const periodEntries = entries.filter(
    (entry) => period === "all" || entry.date.startsWith(monthKey),
  );
  const drives = periodEntries.filter(
    (entry): entry is DriveEntry => entry.type === "drive",
  );
  const fuels = periodEntries.filter(
    (entry): entry is FuelEntry => entry.type === "fuel",
  );

  const drivenMiles = drives.reduce((sum, entry) => sum + entry.miles, 0);
  const fuelSpent = fuels.reduce((sum, entry) => sum + entry.amount, 0);
  const estimatedTripSpent = drives.reduce(
    (sum, entry) =>
      sum + estimateTripCost(entry, allPurchases, fallbackPrice).cost,
    0,
  );
  const gallonsBought = fuels.reduce(
    (sum, entry) => sum + fuelGallons(entry),
    0,
  );

  const memberStats = MEMBERS.map((member) => ({
    member,
    miles: drives
      .filter((drive) => drive.driver === member)
      .reduce((sum, drive) => sum + drive.miles, 0),
    tripCost: drives
      .filter((drive) => drive.driver === member)
      .reduce(
        (sum, drive) =>
          sum + estimateTripCost(drive, allPurchases, fallbackPrice).cost,
        0,
      ),
    paid: fuels
      .filter((fuel) => fuel.payer === member)
      .reduce((sum, fuel) => sum + fuel.amount, 0),
  }));

  const dayCounts = entries.reduce<
    Record<string, { drives: number; fuels: number }>
  >((counts, entry) => {
    const count = counts[entry.date] ?? { drives: 0, fuels: 0 };
    if (entry.type === "drive") count.drives += 1;
    else count.fuels += 1;
    counts[entry.date] = count;
    return counts;
  }, {});

  const sortedEntries = (items: Entry[]) =>
    [...items].sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
    );

  const dayEntries = sortedEntries(
    entries.filter((entry) => entry.date === selectedKey),
  );
  const activity = sortedEntries(
    periodEntries.filter(
      (entry) => activityFilter === "all" || entry.type === activityFilter,
    ),
  );

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
      date: selectedKey,
      createdAt: new Date().toISOString(),
      createdBy: currentUser,
      type: "drive",
      driver: preset.defaultDriver ?? currentUser,
      miles: preset.miles,
      purpose: preset.name,
    });
    // Keep the day sheet open so the new trip is immediately visible.
  }

  function openEntry(type: "drive" | "fuel", date = selectedKey) {
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

  function savePrice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(priceDraft);
    if (!Number.isFinite(value) || value <= 0) {
      setPriceError("Enter a price greater than zero.");
      return;
    }
    setFallbackPrice(value);
    setPriceError("");
    setSettingsOpen(false);
  }

  return (
    <div className='min-h-screen bg-background text-foreground'>
      <header className='border-b bg-card'>
        <div className='mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6'>
          <div>
            <div className='flex items-center gap-3'>
              <img
                src='/logo.png'
                alt=''
                className='size-16 shrink-0 object-contain'
              />

              <div className='flex flex-col gap-0.5'>
                <h1 className='font-title text-5xl tracking-wide sm:text-6xl'>
                  Gas <span className='text-[#f06479]'>Tracker</span>
                </h1>
              </div>
            </div>
          </div>
          <div className='flex flex-wrap items-center gap-3'>
            <ThemeSwitch />
            <Button variant='outline' onClick={() => setPresetsOpen(true)}>
              Trip presets
            </Button>
            <Button
              variant='outline'
              onClick={() => {
                setPriceDraft(String(fallbackPrice));
                setPriceError("");
                setSettingsOpen(true);
              }}
            >
              Settings
            </Button>
            <Select
              value={currentUser}
              onValueChange={(value) => {
                if (value === "Mike" || value === "Mom") setCurrentUser(value);
              }}
            >
              <SelectTrigger className='w-28 bg-card' aria-label='Acting as'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEMBERS.map((member) => (
                  <SelectItem key={member} value={member}>
                    {member}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className='mx-auto max-w-6xl space-y-7 px-4 py-6 sm:px-6'>
        <div className='flex flex-wrap items-end justify-between gap-3'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-wide text-emerald-700'>
              Driving calendar
            </p>
            <h1 className='text-3xl font-bold tracking-tight'>
              {format(calendarMonth, "MMMM yyyy")}
            </h1>
            <p className='mt-1 text-sm text-muted-foreground'>
              Choose a day to view trips and quickly log a regular drive.
            </p>
          </div>
          <div className='flex gap-2'>
            <Button
              onClick={() => openEntry("drive", dateKey(new Date()))}
              variant='default'
            >
              + Custom trip
            </Button>
            <Button
              variant='outline'
              onClick={() => openEntry("fuel", dateKey(new Date()))}
            >
              + Fuel
            </Button>
          </div>
        </div>

        <div className='grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,1fr)]'>
          <Card className='min-w-0'>
            <CardContent>
              <Calendar
                mode='single'
                required
                selected={selectedDate}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                onSelect={setSelectedDate}
                onDayClick={(date) => {
                  setSelectedDate(date);
                  setDayOpen(true);
                }}
                className='w-full [--cell-size:clamp(2.1rem,7vw,4.25rem)]'
                classNames={{
                  root: "w-full",
                  months: "relative flex w-full flex-col gap-4",
                  month: "flex w-full flex-col gap-4",
                  month_grid: "w-full",
                  week: "mt-2 flex w-full",
                  day: "relative w-full flex-1 p-0",
                }}
                components={{
                  DayButton: (props) => {
                    const count = dayCounts[dateKey(props.day.date)];
                    return (
                      <CalendarDayButton {...props}>
                        {props.children}
                        {count && (count.drives > 0 || count.fuels > 0) ? (
                          <span
                            aria-hidden='true'
                            className='absolute bottom-0.5 flex gap-1'
                          >
                            {count.drives > 0 && (
                              <span className='size-1.5 rounded-full bg-emerald-500' />
                            )}
                            {count.fuels > 0 && (
                              <span className='size-1.5 rounded-full bg-amber-500' />
                            )}
                          </span>
                        ) : null}
                      </CalendarDayButton>
                    );
                  },
                }}
              />
              <div className='mt-4 flex items-center justify-center gap-5 text-xs text-muted-foreground'>
                <span className='flex items-center gap-1.5'>
                  <span className='size-2 rounded-full bg-emerald-500' /> Trips
                </span>
                <span className='flex items-center gap-1.5'>
                  <span className='size-2 rounded-full bg-amber-500' /> Gas
                </span>
              </div>
            </CardContent>
          </Card>

          <div className='grid grid-cols-2 gap-3 content-start'>
            {[
              {
                label: "Miles driven",
                value: `${number(drivenMiles, 1)} mi`,
                detail: `${drives.length} trips`,
              },
              {
                label: "Estimated trip costs",
                value: currency(estimatedTripSpent),
                detail: "Fuel used by driving",
              },
              {
                label: "Gas purchased",
                value: currency(fuelSpent),
                detail: `${number(gallonsBought, 2)} gallons`,
              },
              {
                label: "Estimated fuel range",
                value: `${number(gallonsBought * VEHICLE.mpg)} mi`,
                detail: "From gas purchased",
              },
            ].map((stat) => (
              <Card key={stat.label} className='gap-2'>
                <CardHeader>
                  <CardTitle className='text-xs text-muted-foreground'>
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-xl font-semibold sm:text-2xl'>
                    {stat.value}
                  </p>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    {stat.detail}
                  </p>
                </CardContent>
              </Card>
            ))}
            <div className='col-span-2 flex items-center justify-end gap-2'>
              <span className='text-xs text-muted-foreground'>Totals for</span>
              <Select
                value={period}
                onValueChange={(value) => {
                  if (value === "month" || value === "all") setPeriod(value);
                }}
              >
                <SelectTrigger
                  className='w-44 bg-card'
                  aria-label='Statistics period'
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='month'>Displayed month</SelectItem>
                  <SelectItem value='all'>All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <section className='space-y-3'>
          <h2 className='text-lg font-semibold'>By person</h2>
          <div className='grid gap-3 sm:grid-cols-2'>
            {memberStats.map((item) => (
              <Card key={item.member}>
                <CardHeader>
                  <CardTitle>{item.member}</CardTitle>
                </CardHeader>
                <CardContent className='grid grid-cols-3 gap-2'>
                  <div>
                    <p className='text-xs text-muted-foreground'>Miles</p>
                    <p className='text-lg font-semibold'>
                      {number(item.miles, 1)}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-muted-foreground'>
                      Trip cost (est.)
                    </p>
                    <p className='text-lg font-semibold'>
                      {currency(item.tripCost)}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-muted-foreground'>Gas paid</p>
                    <p className='text-lg font-semibold'>
                      {currency(item.paid)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className='space-y-3 pb-12'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <h2 className='text-lg font-semibold'>Activity history</h2>
            <Select
              value={activityFilter}
              onValueChange={(value) => {
                if (value === "all" || value === "drive" || value === "fuel")
                  setActivityFilter(value);
              }}
            >
              <SelectTrigger
                className='w-40 bg-card'
                aria-label='Activity type'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All activity</SelectItem>
                <SelectItem value='drive'>Trips only</SelectItem>
                <SelectItem value='fuel'>Fuel only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card>
            <CardContent>
              {activity.length === 0 ? (
                <p className='py-12 text-center text-sm text-muted-foreground'>
                  No entries for this filter.
                </p>
              ) : (
                activity.map((entry) => (
                  <ActivityRow
                    key={entry.id}
                    entry={entry}
                    purchases={allPurchases}
                    fallbackPrice={fallbackPrice}
                    onEdit={editEntry}
                    onDelete={setPendingDelete}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      {/* A calendar day opens a compact sheet for viewing and quick-adding trips. */}
      <Sheet open={dayOpen} onOpenChange={setDayOpen}>
        <SheetContent className='w-full overflow-y-auto sm:max-w-md'>
          <SheetHeader>
            <SheetTitle className='text-lg'>
              {format(selectedDate, "EEEE, MMMM d")}
            </SheetTitle>
            <SheetDescription>
              Log a trip with one tap or add a custom entry.
            </SheetDescription>
          </SheetHeader>
          <div className='space-y-6 px-6 pb-6'>
            <section className='space-y-2'>
              <div className='flex items-center justify-between'>
                <h3 className='font-semibold'>Quick trips</h3>
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => {
                    setDayOpen(false);
                    setPresetsOpen(true);
                  }}
                >
                  Manage
                </Button>
              </div>
              {presets.length === 0 ? (
                <p className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>
                  No regular trips yet. Create a preset for the grocery store or
                  work commute.
                </p>
              ) : (
                <div className='grid gap-2'>
                  {presets.map((preset) => (
                    <Button
                      key={preset.id}
                      variant='outline'
                      className='h-auto min-h-14 justify-between gap-3 px-3 py-2 text-left'
                      onClick={() => quickAdd(preset)}
                    >
                      <span className='min-w-0 whitespace-normal font-medium'>
                        {preset.name}
                      </span>
                      <span className='shrink-0 text-xs text-muted-foreground'>
                        + {number(preset.miles, 1)} mi
                      </span>
                    </Button>
                  ))}
                </div>
              )}
              <div className='grid grid-cols-2 gap-2 pt-1'>
                <Button variant='outline' onClick={() => openEntry("drive")}>
                  Custom trip
                </Button>
                <Button variant='outline' onClick={() => openEntry("fuel")}>
                  Gas purchase
                </Button>
              </div>
            </section>
            <section>
              <h3 className='mb-2 font-semibold'>
                Logged that day ({dayEntries.length})
              </h3>
              {dayEntries.length === 0 ? (
                <p className='text-sm text-muted-foreground'>
                  No activity recorded.
                </p>
              ) : (
                dayEntries.map((entry) => (
                  <ActivityRow
                    key={entry.id}
                    entry={entry}
                    purchases={allPurchases}
                    fallbackPrice={fallbackPrice}
                    onEdit={editEntry}
                    onDelete={setPendingDelete}
                  />
                ))
              )}
            </section>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog
        open={editor !== null}
        onOpenChange={(open) => {
          if (!open) setEditor(null);
        }}
      >
        {editor && (
          <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle>
                {editor.entry ? "Edit" : "Add"}{" "}
                {editor.type === "drive" ? "trip" : "gas purchase"}
              </DialogTitle>
              <DialogDescription>Record the details below.</DialogDescription>
            </DialogHeader>
            <EntryForm
              key={
                editor.entry?.id ?? `${editor.type}-${editor.date ?? "today"}`
              }
              editor={editor}
              currentUser={currentUser}
              purchases={allPurchases}
              fallbackPrice={fallbackPrice}
              onSave={saveEntry}
              onCancel={() => setEditor(null)}
            />
          </DialogContent>
        )}
      </Dialog>

      <PresetManager
        open={presetsOpen}
        onOpenChange={setPresetsOpen}
        presets={presets}
        onSave={(preset) =>
          setPresets((current) =>
            current.some((item) => item.id === preset.id)
              ? current.map((item) => (item.id === preset.id ? preset : item))
              : [...current, preset],
          )
        }
        onDelete={(id) =>
          setPresets((current) => current.filter((item) => item.id !== id))
        }
      />

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fuel cost settings</DialogTitle>
            <DialogDescription>
              Used for trip estimates when no earlier gas purchase is recorded.
            </DialogDescription>
          </DialogHeader>
          <form className='space-y-4' onSubmit={savePrice}>
            <Field data-invalid={Boolean(priceError)}>
              <FieldLabel htmlFor='fallback-price'>
                Default price per gallon ($)
              </FieldLabel>
              <Input
                id='fallback-price'
                type='number'
                min='0.001'
                step='0.001'
                className='h-11 text-sm'
                value={priceDraft}
                onChange={(event) => {
                  setPriceDraft(event.target.value);
                  setPriceError("");
                }}
              />
              <FieldDescription>
                Actual gas purchase prices take precedence when available.
              </FieldDescription>
              {priceError && <FieldError>{priceError}</FieldError>}
            </Field>
            <Button type='submit' className='w-full'>
              Save settings
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the entry from history and updates the totals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant='destructive' onClick={deleteEntry}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default App;
