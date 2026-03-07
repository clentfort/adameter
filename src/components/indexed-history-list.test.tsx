import { fireEvent, render, screen } from '@testing-library/react';
import { createIndexes, createStore } from 'tinybase';
import { Provider } from 'tinybase/ui-react';
import { describe, expect, it } from 'vitest';
import IndexedHistoryList from './indexed-history-list';

const TEST_TABLE_ID = 'testTable';
const TEST_INDEX_ID = 'testIndex';

function createTestStore(
	entries: Array<{ id: string; timestamp: string; value: string }>,
) {
	const store = createStore();
	for (const entry of entries) {
		store.setRow(TEST_TABLE_ID, entry.id, {
			timestamp: entry.timestamp,
			value: entry.value,
		});
	}
	return store;
}

function createTestIndexes(store: ReturnType<typeof createStore>) {
	const indexes = createIndexes(store);
	indexes.setIndexDefinition(
		TEST_INDEX_ID,
		TEST_TABLE_ID,
		(getCell) => {
			const timestamp = getCell('timestamp');
			if (typeof timestamp !== 'string') return '';
			return timestamp.slice(0, 10); // yyyy-MM-dd
		},
		(getCell) => {
			const timestamp = getCell('timestamp');
			if (typeof timestamp !== 'string') return 0;
			return Date.parse(timestamp);
		},
		(a, b) => b.localeCompare(a), // descending dates
		(a, b) => (typeof b === 'number' ? b : 0) - (typeof a === 'number' ? a : 0), // descending times
	);
	return indexes;
}

function TestWrapper({
	children,
	entries,
}: {
	children: React.ReactNode;
	entries: Array<{ id: string; timestamp: string; value: string }>;
}) {
	const store = createTestStore(entries);
	return <Provider store={store}>{children}</Provider>;
}

describe('IndexedHistoryList', () => {
	it('should render empty state when no date keys', () => {
		const store = createTestStore([]);
		const indexes = createTestIndexes(store);

		render(
			<Provider store={store}>
				<IndexedHistoryList
					dateKeys={[]}
					indexes={indexes}
					indexId={TEST_INDEX_ID}
				>
					{(rowId) => <div data-testid="entry">{rowId}</div>}
				</IndexedHistoryList>
			</Provider>,
		);

		expect(screen.getByText('No data recorded yet.')).toBeInTheDocument();
	});

	it('should render date sections with entries', () => {
		const entries = [
			{ id: 'entry-1', timestamp: '2024-01-15T10:00:00Z', value: 'first' },
			{ id: 'entry-2', timestamp: '2024-01-15T09:00:00Z', value: 'second' },
			{ id: 'entry-3', timestamp: '2024-01-14T12:00:00Z', value: 'third' },
		];
		const store = createTestStore(entries);
		const indexes = createTestIndexes(store);
		const dateKeys = ['2024-01-15', '2024-01-14'];

		render(
			<Provider store={store}>
				<IndexedHistoryList
					dateKeys={dateKeys}
					indexes={indexes}
					indexId={TEST_INDEX_ID}
				>
					{(rowId) => <div data-testid="entry">{rowId}</div>}
				</IndexedHistoryList>
			</Provider>,
		);

		// Check date headers are rendered
		expect(screen.getByText(/Monday, 15. January 2024/)).toBeInTheDocument();
		expect(screen.getByText(/Sunday, 14. January 2024/)).toBeInTheDocument();

		// Check entries are rendered
		const renderedEntries = screen.getAllByTestId('entry');
		expect(renderedEntries).toHaveLength(3);
	});

	it('should filter out empty date keys', () => {
		const entries = [
			{ id: 'entry-1', timestamp: '2024-01-15T10:00:00Z', value: 'first' },
		];
		const store = createTestStore(entries);
		const indexes = createTestIndexes(store);
		const dateKeys = ['2024-01-15', '', ''];

		render(
			<Provider store={store}>
				<IndexedHistoryList
					dateKeys={dateKeys}
					indexes={indexes}
					indexId={TEST_INDEX_ID}
				>
					{(rowId) => <div data-testid="entry">{rowId}</div>}
				</IndexedHistoryList>
			</Provider>,
		);

		// Should only render one date section
		expect(screen.getByText(/Monday, 15. January 2024/)).toBeInTheDocument();
		expect(screen.getAllByTestId('entry')).toHaveLength(1);
	});

	it('should show "Show older entries" when there are more than 14 date sections', () => {
		// Create 20 days worth of entries
		const entries = Array.from({ length: 20 }, (_, i) => ({
			id: `entry-${i}`,
			timestamp: `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
			value: `day-${i}`,
		}));
		const store = createTestStore(entries);
		const indexes = createTestIndexes(store);
		const dateKeys = entries
			.map((e) => e.timestamp.slice(0, 10))
			.sort((a, b) => b.localeCompare(a));

		render(
			<Provider store={store}>
				<IndexedHistoryList
					dateKeys={dateKeys}
					indexes={indexes}
					indexId={TEST_INDEX_ID}
				>
					{(rowId) => <div data-testid="entry">{rowId}</div>}
				</IndexedHistoryList>
			</Provider>,
		);

		// Should show pagination message
		expect(screen.getByText(/Showing 14 of 20 days/)).toBeInTheDocument();
		expect(screen.getByText('Show older entries')).toBeInTheDocument();

		// Only 14 entries should be visible initially
		expect(screen.getAllByTestId('entry')).toHaveLength(14);
	});

	it('should load more entries when "Show older entries" is clicked', () => {
		// Create 20 days worth of entries
		const entries = Array.from({ length: 20 }, (_, i) => ({
			id: `entry-${i}`,
			timestamp: `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
			value: `day-${i}`,
		}));
		const store = createTestStore(entries);
		const indexes = createTestIndexes(store);
		const dateKeys = entries
			.map((e) => e.timestamp.slice(0, 10))
			.sort((a, b) => b.localeCompare(a));

		render(
			<Provider store={store}>
				<IndexedHistoryList
					dateKeys={dateKeys}
					indexes={indexes}
					indexId={TEST_INDEX_ID}
				>
					{(rowId) => <div data-testid="entry">{rowId}</div>}
				</IndexedHistoryList>
			</Provider>,
		);

		// Click show older entries
		fireEvent.click(screen.getByText('Show older entries'));

		// All 20 entries should now be visible
		expect(screen.getAllByTestId('entry')).toHaveLength(20);

		// Pagination message should be gone
		expect(screen.queryByText('Show older entries')).not.toBeInTheDocument();
	});

	it('should sort entries within a date by timestamp descending', () => {
		const entries = [
			{ id: 'entry-early', timestamp: '2024-01-15T08:00:00Z', value: 'early' },
			{ id: 'entry-late', timestamp: '2024-01-15T20:00:00Z', value: 'late' },
			{ id: 'entry-mid', timestamp: '2024-01-15T14:00:00Z', value: 'mid' },
		];
		const store = createTestStore(entries);
		const indexes = createTestIndexes(store);
		const dateKeys = ['2024-01-15'];

		render(
			<Provider store={store}>
				<IndexedHistoryList
					dateKeys={dateKeys}
					indexes={indexes}
					indexId={TEST_INDEX_ID}
				>
					{(rowId) => <div data-testid="entry">{rowId}</div>}
				</IndexedHistoryList>
			</Provider>,
		);

		const renderedEntries = screen.getAllByTestId('entry');
		// Should be sorted by timestamp descending: late (20:00), mid (14:00), early (08:00)
		expect(renderedEntries[0]).toHaveTextContent('entry-late');
		expect(renderedEntries[1]).toHaveTextContent('entry-mid');
		expect(renderedEntries[2]).toHaveTextContent('entry-early');
	});
});
