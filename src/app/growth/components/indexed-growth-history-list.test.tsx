import { fireEvent, render, screen } from '@testing-library/react';
import { createStore } from 'tinybase';
import { Provider } from 'tinybase/ui-react';
import { describe, expect, it, vi } from 'vitest';
import { I18nContext } from '@/contexts/i18n-context';
import { TinybaseIndexesProvider } from '@/contexts/tinybase-indexes-context';
import {
	STORE_VALUE_SELECTED_PROFILE_ID,
	STORE_VALUE_UNIT_SYSTEM,
	TABLE_IDS,
} from '@/lib/tinybase-sync/constants';
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
		headCircumference: 38,
		height: 55,
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
		expect(screen.getByText(/9 lbs 14.7 oz/)).toBeDefined();
		expect(screen.getByText(/9 lbs 11.2 oz/)).toBeDefined();
		expect(screen.getByText(/tooth 51/i)).toBeDefined();
	});

	it('should render weight in grams for German locale', () => {
		const store = createStore();
		store.setRow(TABLE_IDS.GROWTH_MEASUREMENTS, 'growth-1', {
			date: '2024-01-15T11:00:00Z',
			weight: 4500,
		});

		render(
			<I18nContext.Provider
				value={{ locale: 'de-DE', setLocale: async () => {} }}
			>
				<Provider store={store}>
					<TinybaseIndexesProvider>
						<IndexedGrowthHistoryList />
					</TinybaseIndexesProvider>
				</Provider>
			</I18nContext.Provider>,
		);

		expect(screen.getByText(/4.500 g/)).toBeDefined();
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

	it('should handle deletion and editing interactions for growth and teeth entries', () => {
		const store = createStore();
		store.setRow(TABLE_IDS.GROWTH_MEASUREMENTS, 'growth-1', {
			date: '2024-01-15T11:00:00Z',
			weight: 4500,
		});
		store.setRow(TABLE_IDS.TEETHING, 'tooth-51', {
			date: '2024-01-15T10:00:00Z',
			toothId: 51,
		});

		render(
			<Provider store={store}>
				<TinybaseIndexesProvider>
					<IndexedGrowthHistoryList />
				</TinybaseIndexesProvider>
			</Provider>,
		);

		// Growth Edit Save (exercises Line 247)
		fireEvent.click(screen.getAllByTestId('history-entry-actions')[0]);
		fireEvent.click(screen.getAllByText(/edit/i)[0]);
		fireEvent.click(screen.getByRole('button', { name: /save/i }));

		// Tooth Edit Save (exercises Line 258)
		fireEvent.click(screen.getAllByTestId('history-entry-actions')[1]);
		fireEvent.click(screen.getAllByText(/edit/i)[1]);
		fireEvent.click(screen.getByRole('button', { name: /save/i }));

		// Growth Delete Confirm (exercises Lines 202-204, 240)
		fireEvent.click(screen.getAllByTestId('history-entry-actions')[0]);
		fireEvent.click(screen.getAllByText(/delete/i)[0]);
		fireEvent.click(screen.getByRole('button', { name: /delete/i }));

		// Tooth Delete (exercises Line 229)
		fireEvent.click(screen.getByTestId('history-entry-actions'));
		fireEvent.click(screen.getByText(/delete/i));

		expect(screen.getByText(/no history recorded yet/i)).toBeDefined();
	});

	it('should render growth measurements and teeth correctly with metric system and a selected profile ID', () => {
		const store = createStore();

		// Set unit system to metric
		store.setValue(STORE_VALUE_UNIT_SYSTEM, 'metric');
		// Set selected profile ID
		store.setValue(STORE_VALUE_SELECTED_PROFILE_ID, 'profile-1');

		// Add growth measurement with height and head circumference under profile-1
		store.setRow(TABLE_IDS.GROWTH_MEASUREMENTS, 'growth-metric-1', {
			date: '2024-01-15T11:00:00Z',
			headCircumference: 38,
			height: 55,
			notes: 'Growing well',
			profileId: 'profile-1',
			weight: 4500,
		});

		// Add teething entry under profile-1
		store.setRow(TABLE_IDS.TEETHING, 'tooth-metric-51', {
			date: '2024-01-15T10:00:00Z',
			notes: 'First tooth',
			profileId: 'profile-1',
			toothId: 51,
		});

		render(
			<Provider store={store}>
				<TinybaseIndexesProvider>
					<IndexedGrowthHistoryList />
				</TinybaseIndexesProvider>
			</Provider>,
		);

		// Check formatting in metric system
		expect(screen.getByText(/4,500 g/i)).toBeDefined();
		expect(screen.getByText(/55 cm/i)).toBeDefined();
		expect(screen.getByText(/38 cm/i)).toBeDefined();
		expect(screen.getByText(/growing well/i)).toBeDefined();
		expect(screen.getByText(/first tooth/i)).toBeDefined();
	});
});
