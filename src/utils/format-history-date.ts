import { format, isSameYear, isToday, isYesterday, isValid, parseISO } from 'date-fns';
import { fbt } from 'fbtee';

/**
 * Formats a date key (yyyy-MM-dd) for display in history section headers.
 * Returns localized "Today", "Yesterday", or formatted date.
 */
export function formatSectionDate(dateKey: string): string {
	const date = parseISO(dateKey);

	if (!isValid(date)) {
		return dateKey;
	}

	if (isToday(date)) {
		return fbt('Today', 'Label for today in history section').toString();
	}
	if (isYesterday(date)) {
		return fbt('Yesterday', 'Label for yesterday in history section').toString();
	}

	const today = new Date();
	if (isSameYear(date, today)) {
		return format(date, 'EEEE, d. MMMM');
	}
	return format(date, 'EEEE, d. MMMM yyyy');
}

/**
 * Formats a timestamp for display in history entries.
 * @param timestamp - ISO timestamp string
 * @param formatStr - date-fns format string (default: 'p')
 */
export function formatEntryTime(
	timestamp: string | unknown,
	formatStr = 'p',
): string {
	if (typeof timestamp !== 'string') {
		return '';
	}

	const date = parseISO(timestamp);
	if (!isValid(date)) {
		return timestamp;
	}

	return format(date, formatStr);
}

/**
 * Formats a full date for display (e.g., in cards).
 * @param dateStr - ISO date or datetime string
 */
export function formatDisplayDate(dateStr: string): string {
	const date = parseISO(dateStr);
	if (!isValid(date)) {
		return dateStr;
	}
	return format(date, 'dd. MMMM yyyy');
}
