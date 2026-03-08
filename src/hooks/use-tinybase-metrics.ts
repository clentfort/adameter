'use client';

import { useMetric } from 'tinybase/ui-react';
import {
	METRIC_IDS,
	useTinybaseMetrics,
} from '@/contexts/tinybase-metrics-context';

export function useDiaperChangesToday() {
	const metrics = useTinybaseMetrics();
	return useMetric(METRIC_IDS.DIAPER_CHANGES_TODAY, metrics) ?? 0;
}

export function useDiaperChangesTotal() {
	const metrics = useTinybaseMetrics();
	return useMetric(METRIC_IDS.DIAPER_CHANGES_TOTAL, metrics) ?? 0;
}

export function useDiaperStoolCount() {
	const metrics = useTinybaseMetrics();
	return useMetric(METRIC_IDS.DIAPER_STOOL_COUNT, metrics) ?? 0;
}

export function useDiaperUrineCount() {
	const metrics = useTinybaseMetrics();
	return useMetric(METRIC_IDS.DIAPER_URINE_COUNT, metrics) ?? 0;
}

export function useFeedingSessionsToday() {
	const metrics = useTinybaseMetrics();
	return useMetric(METRIC_IDS.FEEDING_SESSIONS_TODAY, metrics) ?? 0;
}

export function useFeedingSessionsTotal() {
	const metrics = useTinybaseMetrics();
	return useMetric(METRIC_IDS.FEEDING_SESSIONS_TOTAL, metrics) ?? 0;
}

export function useFeedingAvgDuration() {
	const metrics = useTinybaseMetrics();
	return useMetric(METRIC_IDS.FEEDING_AVG_DURATION, metrics) ?? 0;
}

export function useGrowthMaxHeight() {
	const metrics = useTinybaseMetrics();
	return useMetric(METRIC_IDS.GROWTH_MAX_HEIGHT, metrics) ?? 0;
}

export function useGrowthMaxWeight() {
	const metrics = useTinybaseMetrics();
	return useMetric(METRIC_IDS.GROWTH_MAX_WEIGHT, metrics) ?? 0;
}

export function useGrowthMeasurementsTotal() {
	const metrics = useTinybaseMetrics();
	return useMetric(METRIC_IDS.GROWTH_MEASUREMENTS_TOTAL, metrics) ?? 0;
}

export function useTeethEruptedCount() {
	const metrics = useTinybaseMetrics();
	return useMetric(METRIC_IDS.TEETH_ERUPTED_COUNT, metrics) ?? 0;
}
