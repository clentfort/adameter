import { render, screen } from '@testing-library/react';
import { createStore } from 'tinybase';
import { Provider } from 'tinybase/ui-react';
import { describe, expect, it, vi } from 'vitest';
import { TinybaseIndexesProvider } from '@/contexts/tinybase-indexes-context';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import IndexedGrowthHistoryList from './indexed-growth-history-list';

// Mock getToothName to avoid external dependencies
vi.mock('../utils/teething', () => ({
	getToothName: (id: number) => `Tooth ${id}`,
}));

function createTestStore() {
	const store = createStore();

	// Add growth measurements
	store.setRow(TABLE_IDS.GROWTH_MEASUREMENTS, 'growth-1', {
		date: '2024-01-15T11:00:00Z',
		weight: 4500,
	});
	store.setRow(TABLE_IDS.GROWTH_MEASUREMENTS, 'growth-2', {
		date: '2024-01-10T11:00:00Z',
		weight: 4400,
	});

	// Add teeth
	store.setRow(TABLE_IDS.TEETHING, 'tooth-51', {
		date: '2024-01-15T10:00:00Z',
		toothId: 51,
	});

	return store;
}

function TestWrapper({ children }: { children: React.ReactNode }) {
	const store = createTestStore();
	return (
		<Provider store={store}>
			<TinybaseIndexesProvider>{children}</TinybaseIndexesProvider>
		</Provider>
	);
}

describe('IndexedGrowthHistoryList', () => {
	it('should render interleaved growth measurements and teeth', () => {
		render(<IndexedGrowthHistoryList />, { wrapper: TestWrapper });

		// Check for dates
		expect(screen.getByText(/monday, 15. january 2024/i)).toBeDefined();
		expect(screen.getByText(/wednesday, 10. january 2024/i)).toBeDefined();

		// Check for entries
		expect(screen.getByText(/4500 g/i)).toBeDefined();
		expect(screen.getByText(/4400 g/i)).toBeDefined();
		expect(screen.getByText(/tooth 51/i)).toBeDefined();
	});

	it('should render empty state when no data is present', () => {
		const emptyStore = createStore();
		render(
			<Provider store={emptyStore}>
				<TinybaseIndexesProvider>
					<IndexedGrowthHistoryList />
				</TinybaseIndexesProvider>
			</Provider>,
		);

		expect(screen.getByText(/no history recorded yet/i)).toBeDefined();
	});
});
