import { Card, CardContent } from "#components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#components/ui/select";
import type { Entry, FuelEntry } from "../../lib/tracker";
import { ActivityRow } from "./activity-row";
import type { ActivityFilter } from "./selectors";

type Props = {
  entries: Entry[];
  purchases: FuelEntry[];
  fallbackPrice: number;
  filter: ActivityFilter;
  onFilterChange: (value: ActivityFilter) => void;
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
};

export function ActivityHistory({
  entries,
  purchases,
  fallbackPrice,
  filter,
  onFilterChange,
  onEdit,
  onDelete,
}: Props) {
  return (
    <section className='space-y-3 pb-12'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h2 className='text-lg font-semibold'>Activity history</h2>
        <Select
          value={filter}
          onValueChange={(value) => {
            if (value === "all" || value === "drive" || value === "fuel") {
              onFilterChange(value);
            }
          }}
        >
          <SelectTrigger className='w-40 bg-card' aria-label='Activity type'>
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
          {entries.length === 0 ? (
            <p className='py-12 text-center text-sm text-muted-foreground'>
              No entries for this filter.
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
        </CardContent>
      </Card>
    </section>
  );
}
