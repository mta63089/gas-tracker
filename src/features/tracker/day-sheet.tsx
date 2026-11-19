import { Button } from "#components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "#components/ui/sheet";
import { format } from "date-fns";
import {
  number,
  type Entry,
  type FuelEntry,
  type TripPreset,
} from "../../lib/tracker";
import { ActivityRow } from "./activity-row";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  entries: Entry[];
  presets: TripPreset[];
  purchases: FuelEntry[];
  fallbackPrice: number;
  onQuickAdd: (preset: TripPreset) => void;
  onManagePresets: () => void;
  onAddTrip: () => void;
  onAddFuel: () => void;
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
};

export function DaySheet({
  open,
  onOpenChange,
  date,
  entries,
  presets,
  purchases,
  fallbackPrice,
  onQuickAdd,
  onManagePresets,
  onAddTrip,
  onAddFuel,
  onEdit,
  onDelete,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-md'>
        <SheetHeader>
          <SheetTitle className='text-lg'>
            {format(date, "EEEE, MMMM d")}
          </SheetTitle>
          <SheetDescription>
            Log a trip with one tap or add a custom entry.
          </SheetDescription>
        </SheetHeader>
        <div className='space-y-6 px-6 pb-6'>
          <section className='space-y-2'>
            <div className='flex items-center justify-between'>
              <h3 className='font-semibold'>Quick trips</h3>
              <Button size='sm' variant='ghost' onClick={onManagePresets}>
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
                    onClick={() => onQuickAdd(preset)}
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
              <Button variant='outline' onClick={onAddTrip}>
                Custom trip
              </Button>
              <Button variant='outline' onClick={onAddFuel}>
                Gas purchase
              </Button>
            </div>
          </section>
          <section>
            <h3 className='mb-2 font-semibold'>
              Logged that day ({entries.length})
            </h3>
            {entries.length === 0 ? (
              <p className='text-sm text-muted-foreground'>
                No activity recorded.
              </p>
            ) : (
              entries.map((entry) => (
                <ActivityRow
                  key={entry.id}
                  entry={entry}
                  purchases={purchases}
                  fallbackPrice={fallbackPrice}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
