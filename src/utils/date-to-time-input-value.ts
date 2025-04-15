export function dateToTimeInputValue(date: Date | string): string {
	if (typeof date === 'string') {
		date = new Date(date);
	}
	return date.toISOString().split('T')[1].slice(0, 5);
}
