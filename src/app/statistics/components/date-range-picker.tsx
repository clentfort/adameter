'use client';

import { Calendar as CalendarIcon } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type TimeRange = {
  from: Date;
  to: Date;
};

type Preset = '7' | '14' | '30' | 'all';

type DateRangePickerProps = {
  className?: string;
  value: Preset | DateRange;
  onValueChange: (value: Preset | DateRange) => void;
};

export default function DateRangePicker({
  className,
  value,
  onValueChange,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  const preset = typeof value === 'string' ? value : 'custom';

  const handlePresetChange = (p: Preset | 'custom') => {
    if (p === 'custom') {
      setOpen(true);
      return;
    }
    const now = new Date();
    switch (p) {
      case '7':
        onValueChange({ from: addDays(now, -7), to: now });
        break;
      case '14':
        onValueChange({ from: addDays(now, -14), to: now });
        break;
      case '30':
        onValueChange({ from: addDays(now, -30), to: now });
        break;
      case 'all':
        onValueChange('all');
        break;
    }
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <div className="flex gap-2">
          <Select
            onValueChange={(p: Preset | 'custom') => handlePresetChange(p)}
            value={preset}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue
                placeholder={
                  <fbt desc="Placeholder text for the time range select input on the statistics page">
                    Time Range
                  </fbt>
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">
                <fbt desc="Option to display data for the last 7 days in statistics">
                  Last 7 Days
                </fbt>
              </SelectItem>
              <SelectItem value="14">
                <fbt desc="Option to display data for the last 14 days in statistics">
                  Last 14 Days
                </fbt>
              </SelectItem>
              <SelectItem value="30">
                <fbt desc="Option to display data for the last 30 days in statistics">
                  Last 30 Days
                </fbt>
              </SelectItem>
              <SelectItem value="all">
                <fbt desc="Option to display all data in statistics">
                  All Data
                </fbt>
              </SelectItem>
              <SelectItem value="custom">
                <fbt desc="Option to display data for a custom range of dates in statistics">
                  Custom
                </fbt>
              </SelectItem>
            </SelectContent>
          </Select>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant="outline"
              className={cn(
                'w-[300px] justify-start text-left font-normal',
                !value && 'text-muted-foreground',
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {typeof value === 'object' && value.from ? (
                value.to ? (
                  <>
                    {format(value.from, 'LLL dd, y')} -{' '}
                    {format(value.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(value.from, 'LLL dd, y')
                )
              ) : (
                <span>
                  <fbt desc="Label for the date range picker input">
                    Pick a date
                  </fbt>
                </span>
              )}
            </Button>
          </PopoverTrigger>
        </div>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={typeof value === 'object' ? value.from : new Date()}
            selected={typeof value === 'object' ? value : undefined}
            onSelect={(range) => {
              if (range) {
                onValueChange(range);
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
