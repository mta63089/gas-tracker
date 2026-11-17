import { useEffect, useState } from "react";

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
import { Card, CardContent, CardHeader, CardTitle } from "#components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "#components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#components/ui/select";

import { EntryForm, type EditorState } from "./components/entry-form";

import {
  MEMBERS,
  VEHICLE,
  currency,
  displayDate,
  estimatedMiles,
  fuelGallons,
  loadEntries,
  number,
  saveEntries,
  today,
  type DriveEntry,
  type Entry,
  type FuelEntry,
  type Member,
} from "./lib/tracker";

type Period = "all" | "month";
type ActivityFilter = "all" | "drive" | "fuel";

function App() {
  const [entries, setEntries] = useState<Entry[]>(loadEntries);
  const [currentUser, setCurrentUser] = useState<Member>("Mike");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Entry | null>(null);

  const [period, setPeriod] = useState<Period>("all");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");

  useEffect(() => {
    saveEntries(entries);
  }, [entries]);

  function handleSave(entry: Entry) {
    setEntries((current) => {
      const exists = current.some((item) => item.id === entry.id);

      if (exists) {
        return current.map((item) => (item.id === entry.id ? entry : item));
      }

      return [...current, entry];
    });

    setEditor(null);
  }

  function handleDelete() {
    if (!pendingDelete) return;

    setEntries((current) =>
      current.filter((entry) => entry.id !== pendingDelete.id),
    );

    setPendingDelete(null);
  }

  const month = today().slice(0, 7);

  const periodEntries = entries.filter(
    (entry) => period === "all" || entry.date.startsWith(month),
  );

  const drives = periodEntries.filter(
    (entry): entry is DriveEntry => entry.type === "drive",
  );

  const purchases = periodEntries.filter(
    (entry): entry is FuelEntry => entry.type === "fuel",
  );

  const totalMiles = drives.reduce((sum, entry) => sum + entry.miles, 0);

  const totalSpent = purchases.reduce((sum, entry) => sum + entry.amount, 0);

  const totalGallons = purchases.reduce(
    (sum, entry) => sum + fuelGallons(entry),
    0,
  );

  const totalFuelMiles = totalGallons * VEHICLE.mpg;

  const costPerMile = totalFuelMiles > 0 ? totalSpent / totalFuelMiles : null;

  const stats = [
    {
      label: "Miles Driven",
      value: number(totalMiles, 1),
      detail: `${drives.length} trips recorded`,
    },
    {
      label: "Gas Purchased",
      value: currency(totalSpent),
      detail: `${number(totalGallons, 2)} gallons`,
    },
    {
      label: "Estimated Fuel Range",
      value: `${number(totalFuelMiles)} mi`,
      detail: `Based on ${VEHICLE.mpg} MPG`,
    },
    {
      label: "Fuel Cost / Mile",
      value: costPerMile === null ? "—" : currency(costPerMile),
      detail: "Estimated from purchases",
    },
  ];

  const memberStats = MEMBERS.map((member) => ({
    member,
    miles: drives
      .filter((entry) => entry.driver === member)
      .reduce((sum, entry) => sum + entry.miles, 0),
    spent: purchases
      .filter((entry) => entry.payer === member)
      .reduce((sum, entry) => sum + entry.amount, 0),
  }));

  const activity = periodEntries
    .filter(
      (entry) => activityFilter === "all" || entry.type === activityFilter,
    )
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
    );

  return (
    <div className='min-h-screen bg-slate-50 text-slate-950'>
      {/* Header */}
      <header className='border-b bg-white'>
        <div className='mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6'>
          <div>
            <h1 className='text-xl font-bold tracking-tight'>Gas Tracker</h1>
            <p className='text-xs text-muted-foreground'>Shared vehicle log</p>
          </div>

          <div className='flex items-center gap-3'>
            <span className='text-xs text-muted-foreground'>Acting as</span>

            <Select
              value={currentUser}
              onValueChange={(value) => {
                if (value === "Mike" || value === "Mom") {
                  setCurrentUser(value);
                }
              }}
            >
              <SelectTrigger
                className='h-10 w-32 bg-white text-sm'
                aria-label='Current user'
              >
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

      <main className='mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6'>
        {/* Vehicle information */}
        <section className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
          <div>
            <p className='mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-700'>
              Vehicle Overview
            </p>

            <h2 className='text-3xl font-bold tracking-tight'>
              {VEHICLE.name}
            </h2>

            <p className='mt-2 text-sm text-muted-foreground'>
              Track your trips, gas purchases, and contributions.
            </p>
          </div>

          <Badge variant='outline' className='w-fit px-3 py-2 text-xs'>
            {VEHICLE.mpg} MPG Estimated
          </Badge>
        </section>

        {/* Quick actions */}
        <section className='grid gap-3 sm:grid-cols-2'>
          <Button
            className='h-14 bg-emerald-700 text-base text-white hover:bg-emerald-800'
            onClick={() => setEditor({ type: "drive" })}
          >
            + Log a Drive
          </Button>

          <Button
            variant='outline'
            className='h-14 border-emerald-200 bg-white text-base text-emerald-800 hover:bg-emerald-50'
            onClick={() => setEditor({ type: "fuel" })}
          >
            + Add Gas Purchase
          </Button>
        </section>

        {/* Overview statistics */}
        <section className='space-y-4'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <h2 className='text-lg font-semibold'>Overview</h2>

            <Select
              value={period}
              onValueChange={(value) => {
                if (value === "all" || value === "month") {
                  setPeriod(value);
                }
              }}
            >
              <SelectTrigger
                className='w-36 bg-white'
                aria-label='Reporting period'
              >
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value='all'>All Time</SelectItem>

                <SelectItem value='month'>This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardHeader>
                  <CardTitle className='text-xs font-medium text-muted-foreground'>
                    {stat.label}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <p className='text-2xl font-semibold tracking-tight sm:text-3xl'>
                    {stat.value}
                  </p>

                  <p className='mt-2 text-xs text-muted-foreground'>
                    {stat.detail}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Per-person breakdown */}
        <section className='space-y-4'>
          <h2 className='text-lg font-semibold'>By Person</h2>

          <div className='grid gap-3 sm:grid-cols-2'>
            {memberStats.map((stat) => (
              <Card key={stat.member}>
                <CardHeader>
                  <CardTitle className='text-base'>{stat.member}</CardTitle>
                </CardHeader>

                <CardContent className='grid grid-cols-2 gap-4'>
                  <div>
                    <p className='text-xs text-muted-foreground'>
                      Miles Driven
                    </p>

                    <p className='mt-1 text-2xl font-semibold'>
                      {number(stat.miles, 1)}
                    </p>
                  </div>

                  <div>
                    <p className='text-xs text-muted-foreground'>
                      Gas Paid For
                    </p>

                    <p className='mt-1 text-2xl font-semibold'>
                      {currency(stat.spent)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Activity history */}
        <section className='space-y-4 pb-12'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div>
              <h2 className='text-lg font-semibold'>Activity History</h2>

              <p className='text-xs text-muted-foreground'>
                {activity.length} entries
              </p>
            </div>

            <Select
              value={activityFilter}
              onValueChange={(value) => {
                if (value === "all" || value === "drive" || value === "fuel") {
                  setActivityFilter(value);
                }
              }}
            >
              <SelectTrigger
                className='w-44 bg-white'
                aria-label='Activity filter'
              >
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value='all'>All Activity</SelectItem>

                <SelectItem value='drive'>Driving Only</SelectItem>

                <SelectItem value='fuel'>Gas Purchases</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent>
              {activity.length === 0 ? (
                <div className='py-12 text-center'>
                  <p className='text-base font-medium'>No entries yet</p>

                  <p className='mt-2 text-sm text-muted-foreground'>
                    Log a drive or gas purchase to get started.
                  </p>
                </div>
              ) : (
                <div className='divide-y'>
                  {activity.map((entry) => (
                    <div
                      key={entry.id}
                      className='flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between'
                    >
                      <div className='flex min-w-0 gap-3'>
                        <div className='pt-0.5'>
                          <Badge
                            variant={
                              entry.type === "drive" ? "secondary" : "outline"
                            }
                          >
                            {entry.type === "drive" ? "Drive" : "Gas"}
                          </Badge>
                        </div>

                        <div className='min-w-0'>
                          <p className='text-sm font-semibold'>
                            {entry.type === "drive"
                              ? entry.purpose
                              : "Gas Purchase"}
                          </p>

                          <p className='mt-1 text-xs text-muted-foreground'>
                            {displayDate(entry.date)}
                            {" · "}
                            {entry.type === "drive"
                              ? `${entry.driver} drove`
                              : `${entry.payer} paid`}
                          </p>

                          <p className='mt-1 text-xs text-muted-foreground'>
                            {entry.type === "fuel"
                              ? `${number(fuelGallons(entry), 2)} gal · ${number(estimatedMiles(entry))} estimated miles · $${entry.pricePerGallon.toFixed(3)}/gal`
                              : `Logged by ${entry.createdBy}`}
                          </p>
                        </div>
                      </div>

                      <div className='flex shrink-0 items-center justify-between gap-3 sm:justify-end'>
                        <p className='text-lg font-semibold'>
                          {entry.type === "drive"
                            ? `${number(entry.miles, 1)} mi`
                            : currency(entry.amount)}
                        </p>

                        <div className='flex gap-1'>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() =>
                              setEditor(
                                entry.type === "drive"
                                  ? {
                                      type: "drive",
                                      entry,
                                    }
                                  : {
                                      type: "fuel",
                                      entry,
                                    },
                              )
                            }
                          >
                            Edit
                          </Button>

                          <Button
                            size='sm'
                            variant='destructive'
                            onClick={() => setPendingDelete(entry)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Add / edit dialog */}
      <Dialog
        open={editor !== null}
        onOpenChange={(open) => {
          if (!open) setEditor(null);
        }}
      >
        {editor && (
          <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle className='text-xl'>
                {editor.entry ? "Edit" : "Add"}{" "}
                {editor.type === "drive" ? "Driving Entry" : "Gas Purchase"}
              </DialogTitle>

              <DialogDescription>
                {editor.type === "drive"
                  ? "Record the distance and purpose of your trip."
                  : "Record a gas purchase and calculate its estimated range."}
              </DialogDescription>
            </DialogHeader>

            <EntryForm
              key={editor.entry?.id ?? editor.type}
              editor={editor}
              currentUser={currentUser}
              onSave={handleSave}
              onCancel={() => setEditor(null)}
            />
          </DialogContent>
        )}
      </Dialog>

      {/* Delete confirmation */}
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
              This will permanently remove the entry from your activity history.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction variant='destructive' onClick={handleDelete}>
              Delete Entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default App;
