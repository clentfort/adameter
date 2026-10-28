import { useTheme } from 'next-themes';
import { useMemo } from 'react';

export interface ChartTheme {
	foreground: string;
	grid: string;
	isDark: boolean;
	rangeBorder: string;
	rangeFill: string;
	referenceLabel: string;
	referenceLine: string;
}

export function getChartTheme(resolvedTheme?: string): ChartTheme {
	const isDark =
		resolvedTheme !== undefined
			? resolvedTheme === 'dark'
			: typeof window !== 'undefined' &&
				document.documentElement.classList.contains('dark');
	const foreground = isDark ? '#f4f4f5' : '#18181b';
	const grid = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
	const rangeFill = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
	const rangeBorder = isDark
		? 'rgba(255, 255, 255, 0.2)'
		: 'rgba(0, 0, 0, 0.1)';
	const referenceLine = isDark
		? 'rgba(255, 255, 255, 0.2)'
		: 'rgba(0, 0, 0, 0.1)';
	const referenceLabel = isDark
		? 'rgba(255, 255, 255, 0.5)'
		: 'rgba(0, 0, 0, 0.4)';

	return {
		foreground,
		grid,
		isDark,
		rangeBorder,
		rangeFill,
		referenceLabel,
		referenceLine,
	};
}

export function useChartTheme(): ChartTheme {
	const { resolvedTheme } = useTheme();
	return useMemo(() => getChartTheme(resolvedTheme), [resolvedTheme]);
}

export function legendLabels(theme: ChartTheme) {
	return {
		color: theme.foreground,
		pointStyle: 'circle' as const,
		usePointStyle: true,
	};
}
