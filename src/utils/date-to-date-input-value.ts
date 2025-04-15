export function dateToDateInputValue(date: Date | string): string {
	if (typeof date === 'string') {
		date = new Date(date);
	}
	return date.toISOString().split('T')[0];
}
