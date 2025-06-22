import { useMemo } from 'react';
import groupBy from '@nkzw/core/groupBy';
import { format, parseISO } from 'date-fns';

// Make the hook generic for any item type T that has an id
interface ItemWithId {
  id: string;
}

export function useSortedEvents<T extends ItemWithId>(
  items: ReadonlyArray<T>,
  dateAccessor: (item: T) => string, // Function to get the date string from an item
) {
  return useMemo(() => {
    if (!items || items.length === 0) {
      return {};
    }

    // Sort all items by date initially, using the dateAccessor
    const sortedItems = [...items].sort(
      (a, b) =>
        parseISO(dateAccessor(b)).getTime() -
        parseISO(dateAccessor(a)).getTime(),
    );

    // Group items by date string, using the dateAccessor
    const groupedByDate = groupBy(sortedItems, (item) =>
      format(parseISO(dateAccessor(item)), 'yyyy-MM-dd'),
    );

    // Convert Map to object
    const result: Record<string, T[]> = {};
    for (const [date, itemArray] of groupedByDate.entries()) {
      result[date] = itemArray;
    }
    return result;
  }, [items, dateAccessor]);
}
