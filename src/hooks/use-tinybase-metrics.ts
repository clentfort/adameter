'use client';

import { useMetric } from 'tinybase/ui-react';
import '@/hooks/use-tinybase-store';
import {
	METRIC_IDS,
	useTinybaseMetrics,
} from '@/contexts/tinybase-metrics-context';

/**
 * Factory function to create a hook that returns a specific metric value.
 */
function createMetricHook<T extends number | undefined = number>(
	metricId: string,
	defaultValue: T = 0 as T,
) {
	return function useMetricValue(): T {
		const metrics = useTinybaseMetrics();
		return (useMetric(metricId, metrics) ?? defaultValue) as T;
	};
}

// Diaper metrics
export const useDiaperChangesToday = createMetricHook(
	METRIC_IDS.DIAPER_CHANGES_TODAY,
);
export const useDiaperChangesTotal = createMetricHook(
	METRIC_IDS.DIAPER_CHANGES_TOTAL,
);
export const useDiaperStoolCount = createMetricHook(
	METRIC_IDS.DIAPER_STOOL_COUNT,
);
export const useDiaperUrineCount = createMetricHook(
	METRIC_IDS.DIAPER_URINE_COUNT,
);

// Feeding metrics
export const useFeedingSessionsToday = createMetricHook(
	METRIC_IDS.FEEDING_SESSIONS_TODAY,
);
export const useFeedingSessionsTotal = createMetricHook(
	METRIC_IDS.FEEDING_SESSIONS_TOTAL,
);
export const useFeedingAvgDuration = createMetricHook(
	METRIC_IDS.FEEDING_AVG_DURATION,
);

// Growth metrics
export const useGrowthMaxHeight = createMetricHook(
	METRIC_IDS.GROWTH_MAX_HEIGHT,
);
export const useGrowthMaxWeight = createMetricHook(
	METRIC_IDS.GROWTH_MAX_WEIGHT,
);
export const useGrowthMeasurementsTotal = createMetricHook(
	METRIC_IDS.GROWTH_MEASUREMENTS_TOTAL,
);

// Teething metrics
export const useTeethEruptedCount = createMetricHook(
	METRIC_IDS.TEETH_ERUPTED_COUNT,
);
