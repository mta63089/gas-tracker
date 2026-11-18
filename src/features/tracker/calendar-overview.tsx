import { format } from 'date-fns';

import { Button } from '#components/ui/button';
import { Calendar, CalendarDayButton } from '#components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '#components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '#components/ui/select';

import { VEHICLE, currency, dateKey, number } from '../../lib/tracker';
import type { DayCounts, Period } from './selectors';

type Totals = {
  trips: number;
  drivenMiles: number;
  estimatedTripSpent: number;
  fuelSpent: number;
  gallonsBought: number;
};

type Props = {
  month: Date;
  selectedDate: Date;
  dayCounts: DayCounts;
  totals: Totals;
  period: Period;
  onPeriodChange: (period: Period) => void;
  onMonthChange: (month: Date) => void;
  onDayClick: (date: Date) => void;
  onAddTrip: () => void;
  onAddFuel: () => void;
};

export function CalendarOverview({
  month, selectedDate, dayCounts, totals, period,
  onPeriodChange, onMonthChange, onDayClick, onAddTrip, onAddFuel,
}: Props) {
  const stats = [
    { label: 'Miles driven', value: `${number(totals.drivenMiles, 1)} mi`, detail: `${totals.trips} trips` },
    { label: 'Estimated trip costs', value: currency(totals.estimatedTripSpent), detail: 'Fuel used by driving' },
    { label: 'Gas purchased', value: currency(totals.fuelSpent), detail: `${number(totals.gallonsBought, 2)} gallons` },
    { label: 'Estimated fuel range', value: `${number(totals.gallonsBought * VEHICLE.mpg)} mi`, detail: 'From gas purchased' },
  ];

  return (
    <section className='space-y-4'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400'>
            Driving calendar
          </p>
          <h2 className='text-3xl font-bold tracking-tight'>
            {format(month, 'MMMM yyyy')}
          </h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            Choose a day to view trips and quickly log a regular drive.
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='default' onClick={onAddTrip}>+ Custom trip</Button>
          <Button variant='outline' onClick={onAddFuel}>+ Fuel</Button>
        </div>
      </div>

      <div className='grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,1fr)]'>
        <Card className='min-w-0'>
          <CardContent>
            <Calendar
              mode='single'
              required
              selected={selectedDate}
              month={month}
              onMonthChange={onMonthChange}
              onDayClick={onDayClick}
              className='w-full [--cell-size:clamp(2.1rem,7vw,4.25rem)]'
              classNames={{
                root: 'w-full',
                // Keep `relative`: the calendar's absolutely-positioned nav
                // otherwise overlaps the application header and blocks clicks.
                months: 'relative flex w-full flex-col gap-4',
                month: 'flex w-full flex-col gap-4',
                month_grid: 'w-full',
                week: 'mt-2 flex w-full',
                day: 'relative w-full flex-1 p-0',
              }}
              components={{
                DayButton: (props) => {
                  const count = dayCounts[dateKey(props.day.date)];
                  return (
                    <CalendarDayButton {...props}>
                      {props.children}
                      {count && (count.drives > 0 || count.fuels > 0) && (
                        <span aria-hidden='true' className='absolute bottom-0.5 flex gap-1'>
                          {count.drives > 0 && <span className='size-1.5 rounded-full bg-emerald-500' />}
                          {count.fuels > 0 && <span className='size-1.5 rounded-full bg-amber-500' />}
                        </span>
                      )}
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

        <div className='grid content-start grid-cols-2 gap-3'>
          {stats.map((stat) => (
            <Card key={stat.label} className='gap-2'>
              <CardHeader>
                <CardTitle className='text-xs text-muted-foreground'>{stat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-xl font-semibold sm:text-2xl'>{stat.value}</p>
                <p className='mt-1 text-xs text-muted-foreground'>{stat.detail}</p>
              </CardContent>
            </Card>
          ))}
          <div className='col-span-2 flex items-center justify-end gap-2'>
            <span className='text-xs text-muted-foreground'>Totals for</span>
            <Select
              value={period}
              onValueChange={(value) => {
                if (value === 'month' || value === 'all') onPeriodChange(value);
              }}
            >
              <SelectTrigger className='w-44 bg-card' aria-label='Statistics period'>
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
    </section>
  );
}
