import { format } from 'date-fns';

export function dateToDateInputValue(date: Date | string): string {
	if (typeof date === 'string') {
		date = new Date(date);
	}
	return format(date, 'yyyy-MM-dd');
}
