'use client';

import type { Metrics } from 'tinybase';
import { createContext, useContext } from 'react';
import { createMetrics } from 'tinybase';
import { useCreateMetrics, useStore } from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';

/**
 * Metric IDs for aggregate calculations.
 */
export const METRIC_IDS = {
	DIAPER_CHANGES_TODAY: 'diaperChangesToday',
	DIAPER_CHANGES_TOTAL: 'diaperChangesTotal',
	DIAPER_STOOL_COUNT: 'diaperStoolCount',
	DIAPER_URINE_COUNT: 'diaperUrineCount',
	FEEDING_AVG_DURATION: 'feedingAvgDuration',
	FEEDING_SESSIONS_TODAY: 'feedingSessionsToday',
	FEEDING_SESSIONS_TOTAL: 'feedingSessionsTotal',
	GROWTH_MAX_HEIGHT: 'growthMaxHeight',
	GROWTH_MAX_WEIGHT: 'growthMaxWeight',
	GROWTH_MEASUREMENTS_TOTAL: 'growthMeasurementsTotal',
	TEETH_ERUPTED_COUNT: 'teethEruptedCount',
} as const;

export const TinybaseMetricsContext = createContext<{
	metrics: Metrics | undefined;
}>({
	metrics: undefined,
});

interface TinybaseMetricsProviderProps {
	children: React.ReactNode;
}

function getToday() {
	return new Date().toISOString().split('T')[0];
}

export function TinybaseMetricsProvider({
	children,
}: TinybaseMetricsProviderProps) {
	const store = useStore();

	const metrics = useCreateMetrics(store, (store) => {
		const m = createMetrics(store);

		// Diaper metrics
		m.setMetricDefinition(
			METRIC_IDS.DIAPER_CHANGES_TOTAL,
			TABLE_IDS.DIAPER_CHANGES,
			'sum',
			() => 1,
		);

		m.setMetricDefinition(
			METRIC_IDS.DIAPER_CHANGES_TODAY,
			TABLE_IDS.DIAPER_CHANGES,
			'sum',
			(getCell) => {
				const timestamp = getCell('timestamp');
				const today = getToday();
				return typeof timestamp === 'string' && timestamp.startsWith(today)
					? 1
					: 0;
			},
		);

		m.setMetricDefinition(
			METRIC_IDS.DIAPER_URINE_COUNT,
			TABLE_IDS.DIAPER_CHANGES,
			'sum',
			(getCell) => (getCell('containsUrine') ? 1 : 0),
		);

		m.setMetricDefinition(
			METRIC_IDS.DIAPER_STOOL_COUNT,
			TABLE_IDS.DIAPER_CHANGES,
			'sum',
			(getCell) => (getCell('containsStool') ? 1 : 0),
		);

		// Feeding metrics
		m.setMetricDefinition(
			METRIC_IDS.FEEDING_SESSIONS_TOTAL,
			TABLE_IDS.FEEDING_SESSIONS,
			'sum',
			() => 1,
		);

		m.setMetricDefinition(
			METRIC_IDS.FEEDING_SESSIONS_TODAY,
			TABLE_IDS.FEEDING_SESSIONS,
			'sum',
			(getCell) => {
				const startTime = getCell('startTime');
				const today = getToday();
				return typeof startTime === 'string' && startTime.startsWith(today)
					? 1
					: 0;
			},
		);

		m.setMetricDefinition(
			METRIC_IDS.FEEDING_AVG_DURATION,
			TABLE_IDS.FEEDING_SESSIONS,
			'avg',
			'durationInSeconds',
		);

		// Growth metrics
		m.setMetricDefinition(
			METRIC_IDS.GROWTH_MEASUREMENTS_TOTAL,
			TABLE_IDS.GROWTH_MEASUREMENTS,
			'sum',
			() => 1,
		);

		m.setMetricDefinition(
			METRIC_IDS.GROWTH_MAX_WEIGHT,
			TABLE_IDS.GROWTH_MEASUREMENTS,
			'max',
			'weight',
		);

		m.setMetricDefinition(
			METRIC_IDS.GROWTH_MAX_HEIGHT,
			TABLE_IDS.GROWTH_MEASUREMENTS,
			'max',
			'height',
		);

		// Teething metrics
		m.setMetricDefinition(
			METRIC_IDS.TEETH_ERUPTED_COUNT,
			TABLE_IDS.TEETHING,
			'sum',
			(getCell) => (getCell('date') ? 1 : 0),
		);

		return m;
	});

	return (
		<TinybaseMetricsContext.Provider value={{ metrics }}>
			{children}
		</TinybaseMetricsContext.Provider>
	);
}

export function useTinybaseMetrics() {
	const context = useContext(TinybaseMetricsContext);
	return context.metrics;
}
