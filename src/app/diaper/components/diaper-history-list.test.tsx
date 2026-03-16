import type { DiaperChange } from '@/types/diaper';
import { render, screen } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createStore } from 'tinybase';
import { Provider } from 'tinybase/ui-react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TinybaseIndexesProvider } from '@/contexts/tinybase-indexes-context';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import DiaperHistoryList from './diaper-history-list';

function createStoreWithDiaperChanges(changes: DiaperChange[]) {
	const store = createStore();
	for (const change of changes) {
		store.setRow(TABLE_IDS.DIAPER_CHANGES, change.id, {
			containsStool: change.containsStool,
			containsUrine: change.containsUrine,
			diaperProductId: change.diaperProductId ?? '',
			leakage: change.leakage ?? false,
			notes: change.notes ?? '',
			pottyStool: change.pottyStool ?? false,
			pottyUrine: change.pottyUrine ?? false,
			temperature: change.temperature ?? 0,
			timestamp: change.timestamp,
		});
	}
	return store;
}

vi.mock('next/navigation', () => ({
	useRouter: vi.fn(),
	useSearchParams: vi.fn(),
}));

const mockUseRouter = vi.mocked(useRouter);
const mockUseSearchParams = vi.mocked(useSearchParams);

function TestWrapper({
	changes,
	children,
}: {
	changes: DiaperChange[];
	children: React.ReactNode;
}) {
	const store = createStoreWithDiaperChanges(changes);
	return (
		<Provider store={store}>
			<TinybaseIndexesProvider>{children}</TinybaseIndexesProvider>
		</Provider>
	);
}

describe('DiaperHistoryList', () => {
	beforeEach(() => {
		mockUseRouter.mockReturnValue({
			push: vi.fn(),
		} as unknown as ReturnType<typeof useRouter>);
		mockUseSearchParams.mockReturnValue(
			new URLSearchParams(
				'from=2024-01-01T00:00:00Z&to=2024-01-31T23:59:59Z',
			) as unknown as ReturnType<typeof useSearchParams>,
		);
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should render empty state when no diaper changes', () => {
		render(
			<TestWrapper changes={[]}>
				<DiaperHistoryList />
			</TestWrapper>,
		);

		expect(screen.getByText('No data recorded yet.')).toBeInTheDocument();
	});

	it('should render a urine-only diaper change', () => {
		const mockChange: DiaperChange = {
			containsStool: false,
			containsUrine: true,
			id: 'change-1',
			timestamp: '2024-01-15T10:30:00Z',
		};

		render(
			<TestWrapper changes={[mockChange]}>
				<DiaperHistoryList />
			</TestWrapper>,
		);

		expect(screen.getByText('Urine')).toBeInTheDocument();
		expect(screen.getByText('10:30 AM')).toBeInTheDocument();
		expect(screen.getByTestId('diaper-history-entry')).toBeInTheDocument();
	});

	it('should render a stool-only diaper change', () => {
		const mockChange: DiaperChange = {
			containsStool: true,
			containsUrine: false,
			id: 'change-1',
			timestamp: '2024-01-15T14:00:00Z',
		};

		render(
			<TestWrapper changes={[mockChange]}>
				<DiaperHistoryList />
			</TestWrapper>,
		);

		expect(screen.getByText('Stool')).toBeInTheDocument();
	});

	it('should render urine and stool diaper change', () => {
		const mockChange: DiaperChange = {
			containsStool: true,
			containsUrine: true,
			id: 'change-1',
			timestamp: '2024-01-15T10:30:00Z',
		};

		render(
			<TestWrapper changes={[mockChange]}>
				<DiaperHistoryList />
			</TestWrapper>,
		);

		expect(screen.getByText('Urine & Stool')).toBeInTheDocument();
	});

	it('should render a dry diaper change', () => {
		const mockChange: DiaperChange = {
			containsStool: false,
			containsUrine: false,
			id: 'change-1',
			timestamp: '2024-01-15T10:30:00Z',
		};

		render(
			<TestWrapper changes={[mockChange]}>
				<DiaperHistoryList />
			</TestWrapper>,
		);

		expect(screen.getByText('Dry')).toBeInTheDocument();
	});

	it('should render temperature when provided', () => {
		const mockChange: DiaperChange = {
			containsStool: false,
			containsUrine: true,
			id: 'change-1',
			temperature: 36.5,
			timestamp: '2024-01-15T10:30:00Z',
		};

		render(
			<TestWrapper changes={[mockChange]}>
				<DiaperHistoryList />
			</TestWrapper>,
		);

		expect(screen.getByText(/36.5 °C/)).toBeInTheDocument();
	});

	it('should highlight abnormal temperature', () => {
		const mockChange: DiaperChange = {
			containsStool: false,
			containsUrine: true,
			id: 'change-1',
			temperature: 38.5, // fever
			timestamp: '2024-01-15T10:30:00Z',
		};

		render(
			<TestWrapper changes={[mockChange]}>
				<DiaperHistoryList />
			</TestWrapper>,
		);

		const tempElement = screen.getByText(/38.5 °C/);
		expect(tempElement.parentElement).toHaveClass('text-red-600');
	});

	it('should render leakage indicator when diaper leaked', () => {
		const mockChange: DiaperChange = {
			containsStool: false,
			containsUrine: true,
			id: 'change-1',
			leakage: true,
			timestamp: '2024-01-15T10:30:00Z',
		};

		render(
			<TestWrapper changes={[mockChange]}>
				<DiaperHistoryList />
			</TestWrapper>,
		);

		expect(screen.getByText('leaked')).toBeInTheDocument();
	});

	it('should render notes when provided', () => {
		const mockChange: DiaperChange = {
			containsStool: false,
			containsUrine: true,
			id: 'change-1',
			notes: 'Slight redness observed',
			timestamp: '2024-01-15T10:30:00Z',
		};

		render(
			<TestWrapper changes={[mockChange]}>
				<DiaperHistoryList />
			</TestWrapper>,
		);

		expect(screen.getByText('Slight redness observed')).toBeInTheDocument();
	});

	it('should render potty usage', () => {
		const mockChange: DiaperChange = {
			containsStool: false,
			containsUrine: false,
			id: 'change-1',
			pottyStool: false,
			pottyUrine: true,
			timestamp: '2024-01-15T10:30:00Z',
		};

		render(
			<TestWrapper changes={[mockChange]}>
				<DiaperHistoryList />
			</TestWrapper>,
		);

		// Check for potty emoji and urine text
		expect(screen.getByText('🚽')).toBeInTheDocument();
		expect(screen.getByText('Urine')).toBeInTheDocument();
	});

	it('should group changes by date', () => {
		const changes: DiaperChange[] = [
			{
				containsStool: false,
				containsUrine: true,
				id: 'change-1',
				timestamp: '2024-01-15T10:30:00Z',
			},
			{
				containsStool: true,
				containsUrine: false,
				id: 'change-2',
				timestamp: '2024-01-15T14:00:00Z',
			},
			{
				containsStool: false,
				containsUrine: true,
				id: 'change-3',
				timestamp: '2024-01-14T09:00:00Z',
			},
		];

		render(
			<TestWrapper changes={changes}>
				<DiaperHistoryList />
			</TestWrapper>,
		);

		// Should show two date headers
		expect(screen.getByText('Today')).toBeInTheDocument();
		expect(screen.getByText('Yesterday')).toBeInTheDocument();

		// Should render all three entries
		expect(screen.getAllByTestId('diaper-history-entry')).toHaveLength(3);
	});
});
