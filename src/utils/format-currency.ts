import type { Currency } from '@/hooks/use-currency';

export function formatCurrency(
	value: number,
	currency: Currency,
	locale: string,
): string {
	return new Intl.NumberFormat(locale.replace('_', '-'), {
		currency,
		maximumFractionDigits: 2,
		minimumFractionDigits: 2,
		style: 'currency',
	}).format(value);
}
