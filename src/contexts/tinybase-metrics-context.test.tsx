import { renderHook } from '@testing-library/react';
import { createStore } from 'tinybase';
import { Provider } from 'tinybase/ui-react';
import { describe, expect, it } from 'vitest';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import {
	METRIC_IDS,
	TinybaseMetricsProvider,
	useTinybaseMetrics,
} from './tinybase-metrics-context';

function createTestStore() {
	const store = createStore();
	const today = new Date().toISOString().split('T')[0];
	const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

	// Diaper changes
	store.setRow(TABLE_IDS.DIAPER_CHANGES, 'diaper-1', {
		containsStool: false,
		containsUrine: true,
		timestamp: `${today}T10:00:00Z`,
	});
	store.setRow(TABLE_IDS.DIAPER_CHANGES, 'diaper-2', {
		containsStool: true,
		containsUrine: false,
		timestamp: `${yesterday}T09:00:00Z`,
	});
	store.setRow(TABLE_IDS.DIAPER_CHANGES, 'diaper-3', {
		containsStool: true,
		containsUrine: true,
		timestamp: `${today}T11:00:00Z`,
	});

	// Feeding sessions
	store.setRow(TABLE_IDS.FEEDING_SESSIONS, 'feeding-1', {
		durationInSeconds: 600, // 10 min
		startTime: `${today}T07:00:00Z`,
	});
	store.setRow(TABLE_IDS.FEEDING_SESSIONS, 'feeding-2', {
		durationInSeconds: 1200, // 20 min
		startTime: `${yesterday}T07:00:00Z`,
	});

	// Growth measurements
	store.setRow(TABLE_IDS.GROWTH_MEASUREMENTS, 'growth-1', {
		height: 50,
		weight: 4000,
	});
	store.setRow(TABLE_IDS.GROWTH_MEASUREMENTS, 'growth-2', {
		height: 55,
		weight: 4500,
	});

	// Teething
	store.setRow(TABLE_IDS.TEETHING, 'tooth-1', {
		date: '2024-01-01',
		toothId: 1,
	});
	store.setRow(TABLE_IDS.TEETHING, 'tooth-2', {
		toothId: 2,
		// missing date, should not count towards erupted
	});

	return store;
}

function TestWrapper({ children }: { children: React.ReactNode }) {
	const store = createTestStore();
	return (
		<Provider store={store}>
			<TinybaseMetricsProvider>{children}</TinybaseMetricsProvider>
		</Provider>
	);
}

describe('TinybaseMetricsProvider', () => {
	it('should provide metrics through context', () => {
		const { result } = renderHook(() => useTinybaseMetrics(), {
			wrapper: TestWrapper,
		});

		expect(result.current).toBeDefined();
	});

	it('should calculate diaper metrics correctly', () => {
		const { result } = renderHook(() => useTinybaseMetrics(), {
			wrapper: TestWrapper,
		});

		const metrics = result.current!;
		expect(metrics.getMetric(METRIC_IDS.DIAPER_CHANGES_TOTAL)).toBe(3);
		expect(metrics.getMetric(METRIC_IDS.DIAPER_CHANGES_TODAY)).toBe(2);
		expect(metrics.getMetric(METRIC_IDS.DIAPER_URINE_COUNT)).toBe(2);
		expect(metrics.getMetric(METRIC_IDS.DIAPER_STOOL_COUNT)).toBe(2);
	});

	it('should calculate feeding metrics correctly', () => {
		const { result } = renderHook(() => useTinybaseMetrics(), {
			wrapper: TestWrapper,
		});

		const metrics = result.current!;
		expect(metrics.getMetric(METRIC_IDS.FEEDING_SESSIONS_TOTAL)).toBe(2);
		expect(metrics.getMetric(METRIC_IDS.FEEDING_SESSIONS_TODAY)).toBe(1);
		expect(metrics.getMetric(METRIC_IDS.FEEDING_AVG_DURATION)).toBe(900); // (600+1200)/2
	});

	it('should calculate growth metrics correctly', () => {
		const { result } = renderHook(() => useTinybaseMetrics(), {
			wrapper: TestWrapper,
		});

		const metrics = result.current!;
		expect(metrics.getMetric(METRIC_IDS.GROWTH_MEASUREMENTS_TOTAL)).toBe(2);
		expect(metrics.getMetric(METRIC_IDS.GROWTH_MAX_WEIGHT)).toBe(4500);
		expect(metrics.getMetric(METRIC_IDS.GROWTH_MAX_HEIGHT)).toBe(55);
	});

	it('should calculate teething metrics correctly', () => {
		const { result } = renderHook(() => useTinybaseMetrics(), {
			wrapper: TestWrapper,
		});

		const metrics = result.current!;
		expect(metrics.getMetric(METRIC_IDS.TEETH_ERUPTED_COUNT)).toBe(1);
	});

	it('should update metrics reactively', () => {
		const store = createStore();
		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<Provider store={store}>
				<TinybaseMetricsProvider>{children}</TinybaseMetricsProvider>
			</Provider>
		);

		const { result } = renderHook(() => useTinybaseMetrics(), { wrapper });
		const metrics = result.current!;

		expect(metrics.getMetric(METRIC_IDS.DIAPER_CHANGES_TOTAL)).toBeUndefined();

		store.setRow(TABLE_IDS.DIAPER_CHANGES, 'new-diaper', {
			containsUrine: true,
		});

		expect(metrics.getMetric(METRIC_IDS.DIAPER_CHANGES_TOTAL)).toBe(1);
		expect(metrics.getMetric(METRIC_IDS.DIAPER_URINE_COUNT)).toBe(1);

		store.delRow(TABLE_IDS.DIAPER_CHANGES, 'new-diaper');

		expect(metrics.getMetric(METRIC_IDS.DIAPER_CHANGES_TOTAL)).toBeUndefined();
	});
});
