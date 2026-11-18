import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';
import {
  currency, displayDate, estimateTripCost, estimatedMiles, fuelGallons, number,
  type Entry, type FuelEntry,
} from '../../lib/tracker';

type Props = {
  entry: Entry;
  purchases: FuelEntry[];
  fallbackPrice: number;
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
};

export function ActivityRow({ entry, purchases, fallbackPrice, onEdit, onDelete }: Props) {
  const estimate = entry.type === 'drive'
    ? estimateTripCost(entry, purchases, fallbackPrice)
    : null;

  return (
    <div className='flex flex-wrap items-center justify-between gap-3 border-b py-4 last:border-b-0'>
      <div className='min-w-0 space-y-1'>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge variant={entry.type === 'drive' ? 'secondary' : 'outline'}>
            {entry.type === 'drive' ? 'Trip' : 'Fuel'}
          </Badge>
          <p className='font-medium'>
            {entry.type === 'drive' ? entry.purpose : 'Gas purchase'}
          </p>
        </div>
        <p className='text-xs text-muted-foreground'>
          {displayDate(entry.date)} · {entry.type === 'drive' ? entry.driver : entry.payer}
        </p>
        <p className='text-xs text-muted-foreground'>
          {entry.type === 'drive'
            ? `${number(entry.miles, 1)} mi · ${currency(estimate!.cost)} estimated fuel cost${estimate!.source === 'fallback' ? ' (default price)' : ''}`
            : `${number(fuelGallons(entry), 2)} gal · ${number(estimatedMiles(entry))} mi estimated range · $${entry.pricePerGallon.toFixed(3)}/gal`}
        </p>
      </div>
      <div className='flex items-center gap-1'>
        <p className='mr-2 font-semibold'>
          {entry.type === 'drive' ? `${number(entry.miles, 1)} mi` : currency(entry.amount)}
        </p>
        <Button size='sm' variant='outline' onClick={() => onEdit(entry)}>Edit</Button>
        <Button size='sm' variant='destructive' onClick={() => onDelete(entry)}>Delete</Button>
      </div>
    </div>
  );
}
