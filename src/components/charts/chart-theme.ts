export interface ChartTheme {
	foreground: string;
	grid: string;
	isDark: boolean;
}

export function getChartTheme(): ChartTheme {
	const isDark =
		typeof window !== 'undefined' &&
		document.documentElement.classList.contains('dark');
	const foreground = isDark ? '#f4f4f5' : '#18181b';
	const grid = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';

	return {
		foreground,
		grid,
		isDark,
	};
}

export function legendLabels(theme: ChartTheme) {
	return {
		color: theme.foreground,
		pointStyle: 'circle' as const,
		usePointStyle: true,
	};
}
