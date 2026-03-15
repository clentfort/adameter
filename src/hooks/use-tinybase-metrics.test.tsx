import { renderHook } from '@testing-library/react';
import { createStore } from 'tinybase';
import { Provider } from 'tinybase/ui-react';
import '@/hooks/use-tinybase-store';
import { describe, expect, it } from 'vitest';
import { TinybaseMetricsProvider } from '@/contexts/tinybase-metrics-context';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import {
	useDiaperChangesToday,
	useDiaperChangesTotal,
	useDiaperStoolCount,
	useDiaperUrineCount,
	useFeedingAvgDuration,
	useFeedingSessionsToday,
	useFeedingSessionsTotal,
	useGrowthMaxHeight,
	useGrowthMaxWeight,
	useGrowthMeasurementsTotal,
	useTeethEruptedCount,
} from './use-tinybase-metrics';

function createTestStore() {
	const store = createStore();
	const today = new Date().toISOString().split('T')[0];

	store.setRow(TABLE_IDS.DIAPER_CHANGES, 'd1', {
		containsUrine: true,
		timestamp: `${today}T10:00:00Z`,
	});
	store.setRow(TABLE_IDS.DIAPER_CHANGES, 'd2', { containsStool: true });

	store.setRow(TABLE_IDS.FEEDING_SESSIONS, 'f1', {
		durationInSeconds: 100,
		startTime: `${today}T10:00:00Z`,
	});
	store.setRow(TABLE_IDS.FEEDING_SESSIONS, 'f2', { durationInSeconds: 300 });

	store.setRow(TABLE_IDS.GROWTH_MEASUREMENTS, 'g1', {
		height: 50,
		weight: 4000,
	});
	store.setRow(TABLE_IDS.GROWTH_MEASUREMENTS, 'g2', {
		height: 60,
		weight: 5000,
	});

	store.setRow(TABLE_IDS.TEETHING, 't1', { date: '2024-01-01' });

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

describe('use-tinybase-metrics', () => {
	it('useDiaperChangesTotal should return correct value', () => {
		const { result } = renderHook(() => useDiaperChangesTotal(), {
			wrapper: TestWrapper,
		});
		expect(result.current).toBe(2);
	});

	it('useDiaperChangesToday should return correct value', () => {
		const { result } = renderHook(() => useDiaperChangesToday(), {
			wrapper: TestWrapper,
		});
		expect(result.current).toBe(1);
	});

	it('useDiaperUrineCount should return correct value', () => {
		const { result } = renderHook(() => useDiaperUrineCount(), {
			wrapper: TestWrapper,
		});
		expect(result.current).toBe(1);
	});

	it('useDiaperStoolCount should return correct value', () => {
		const { result } = renderHook(() => useDiaperStoolCount(), {
			wrapper: TestWrapper,
		});
		expect(result.current).toBe(1);
	});

	it('useFeedingSessionsTotal should return correct value', () => {
		const { result } = renderHook(() => useFeedingSessionsTotal(), {
			wrapper: TestWrapper,
		});
		expect(result.current).toBe(2);
	});

	it('useFeedingSessionsToday should return correct value', () => {
		const { result } = renderHook(() => useFeedingSessionsToday(), {
			wrapper: TestWrapper,
		});
		expect(result.current).toBe(1);
	});

	it('useFeedingAvgDuration should return correct value', () => {
		const { result } = renderHook(() => useFeedingAvgDuration(), {
			wrapper: TestWrapper,
		});
		expect(result.current).toBe(200);
	});

	it('useGrowthMaxWeight should return correct value', () => {
		const { result } = renderHook(() => useGrowthMaxWeight(), {
			wrapper: TestWrapper,
		});
		expect(result.current).toBe(5000);
	});

	it('useGrowthMaxHeight should return correct value', () => {
		const { result } = renderHook(() => useGrowthMaxHeight(), {
			wrapper: TestWrapper,
		});
		expect(result.current).toBe(60);
	});

	it('useGrowthMeasurementsTotal should return correct value', () => {
		const { result } = renderHook(() => useGrowthMeasurementsTotal(), {
			wrapper: TestWrapper,
		});
		expect(result.current).toBe(2);
	});

	it('useTeethEruptedCount should return correct value', () => {
		const { result } = renderHook(() => useTeethEruptedCount(), {
			wrapper: TestWrapper,
		});
		expect(result.current).toBe(1);
	});
});
