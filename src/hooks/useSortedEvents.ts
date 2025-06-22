import { useMemo } from 'react';
import { Event } from '@/types/event';
import groupBy from '@nkzw/core/groupBy';
import { format, parseISO } from 'date-fns';

export function useSortedEvents(events: ReadonlyArray<Event>) {
  return useMemo(() => {
    if (!events || events.length === 0) {
      return {};
    }

    // Sort all events by date initially
    const sortedEvents = [...events].sort(
      (a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime(),
    );

    // Group events by date string
    const groupedByDate = groupBy(sortedEvents, (event) =>
      format(parseISO(event.date), 'yyyy-MM-dd'),
    );

    // Convert Map to object
    const result: Record<string, Event[]> = {};
    for (const [date, eventArray] of groupedByDate.entries()) {
      result[date] = eventArray;
    }
    return result;
  }, [events]);
}
