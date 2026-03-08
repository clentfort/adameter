import { render, screen } from '@testing-library/react';
import { createStore } from 'tinybase';
import { Provider } from 'tinybase/ui-react';
import { describe, expect, it, vi } from 'vitest';
import { TinybaseMetricsProvider } from '@/contexts/tinybase-metrics-context';
import StatisticsSummary from './statistics-summary';

// Mock the metrics hooks
vi.mock('@/hooks/use-tinybase-metrics', () => ({
	useDiaperChangesToday: () => 5,
	useDiaperChangesTotal: () => 100,
	useFeedingSessionsToday: () => 8,
	useFeedingSessionsTotal: () => 200,
	useGrowthMaxWeight: () => 4500,
	useTeethEruptedCount: () => 4,
}));

function TestWrapper({ children }: { children: React.ReactNode }) {
	const store = createStore();
	return (
		<Provider store={store}>
			<TinybaseMetricsProvider>{children}</TinybaseMetricsProvider>
		</Provider>
	);
}

describe('StatisticsSummary', () => {
	it('renders correctly with metrics data', () => {
		render(<StatisticsSummary />, { wrapper: TestWrapper });

		expect(screen.getByText('Diaper Changes')).toBeInTheDocument();
		expect(screen.getByText('5')).toBeInTheDocument();
		expect(screen.getByText(/100 total/)).toBeInTheDocument();

		expect(screen.getByText('Feedings')).toBeInTheDocument();
		expect(screen.getByText('8')).toBeInTheDocument();
		expect(screen.getByText(/200 total/)).toBeInTheDocument();

		expect(screen.getByText('Teeth')).toBeInTheDocument();
		expect(screen.getByText('4')).toBeInTheDocument();
		expect(screen.getByText('erupted')).toBeInTheDocument();

		expect(screen.getByText('Max Weight')).toBeInTheDocument();
		expect(screen.getByText('4500')).toBeInTheDocument();
		expect(screen.getByText('grams')).toBeInTheDocument();
	});
});
