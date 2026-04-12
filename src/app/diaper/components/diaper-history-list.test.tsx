import type { DiaperChange } from '@/types/diaper';
import { fireEvent, render, screen } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createStore } from 'tinybase';
import { Provider } from 'tinybase/ui-react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nContext, I18nProvider } from '@/contexts/i18n-context';
import { TinybaseIndexesProvider } from '@/contexts/tinybase-indexes-context';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import DiaperHistoryList from './diaper-history-list';

vi.mock('@/i18n', async (importOriginal) => {
	const original = (await importOriginal()) as Record<string, unknown>;
	return {
		...original,
		getPreferredLocale: () => original.DEFAULT_LOCALE,
	};
});

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
	locale = 'en_US',
}: {
	changes: DiaperChange[];
	children: React.ReactNode;
	locale?: 'en_US' | 'de_DE';
}) {
	const store = createStoreWithDiaperChanges(changes);
	return (
		<I18nProvider>
			<Provider store={store}>
				<TinybaseIndexesProvider>{children}</TinybaseIndexesProvider>
			</Provider>
		</I18nProvider>
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

		expect(screen.getByText(/97.7 °F/)).toBeInTheDocument();
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

		const tempElement = screen.getByText(/101.3 °F/);
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

	it('should render temperature in Celsius for German locale', () => {
		const mockChange: DiaperChange = {
			containsStool: false,
			containsUrine: true,
			id: 'change-1',
			temperature: 36.5,
			timestamp: '2024-01-15T10:30:00Z',
		};

		const store = createStoreWithDiaperChanges([mockChange]);

		render(
			<I18nContext.Provider
				value={{ locale: 'de_DE', setLocale: async () => {} }}
			>
				<Provider store={store}>
					<TinybaseIndexesProvider>
						<DiaperHistoryList />
					</TinybaseIndexesProvider>
				</Provider>
			</I18nContext.Provider>,
		);

		expect(screen.getByText(/36.5 °C/)).toBeInTheDocument();
	});

	it('should render complex entries and handle interactions for maximum coverage', () => {
		const mockProduct = { id: 'prod-1', name: 'Premium Diaper' };
		const changes: DiaperChange[] = [
			{
				containsStool: true,
				containsUrine: true,
				diaperProductId: mockProduct.id,
				id: 'change-1',
				leakage: true,
				pottyStool: true,
				pottyUrine: true,
				timestamp: '2024-01-15T10:00:00Z',
			},
			{
				containsStool: true,
				containsUrine: false,
				diaperProductId: 'unknown-prod',
				id: 'change-2',
				pottyStool: true,
				pottyUrine: false,
				timestamp: '2024-01-15T11:00:00Z',
			},
		];

		const store = createStoreWithDiaperChanges(changes);
		// Add the product to the store for lookup
		store.setRow(TABLE_IDS.DIAPER_PRODUCTS, mockProduct.id, {
			name: mockProduct.name,
		});

		render(
			<Provider store={store}>
				<I18nProvider>
					<TinybaseIndexesProvider>
						<DiaperHistoryList />
					</TinybaseIndexesProvider>
				</I18nProvider>
			</Provider>,
		);

		// Verify first entry: Potty (Both), Known Product, Leakage with bullet
		expect(screen.getByText('Premium Diaper')).toBeInTheDocument();
		expect(screen.getAllByText('Urine & Stool')).toHaveLength(2); // One for diaper, one for potty
		expect(screen.getByText('leaked')).toBeInTheDocument();
		expect(screen.getByText('•')).toBeInTheDocument(); // Leakage bullet point

		// Verify second entry: Potty (Stool only), Unknown Product
		expect(screen.getByText('Unknown Product')).toBeInTheDocument();
		expect(screen.getAllByText('Stool')).toHaveLength(2); // One for diaper (implied by accent color logic but here actually rendered), one for potty

		// Interaction: Open and close Edit Dialog
		const actions = screen.getAllByTestId('history-entry-actions');
		fireEvent.click(actions[0]);
		fireEvent.click(screen.getByText('Edit'));
		expect(screen.getByText('Edit Diaper Entry')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
		expect(screen.queryByText('Edit Diaper Entry')).not.toBeInTheDocument();

		// Interaction: Open and close Delete Dialog
		fireEvent.click(actions[0]);
		fireEvent.click(screen.getByText('Delete'));
		expect(
			screen.getByText(/do you really want to delete this entry\?/i),
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
		expect(
			screen.queryByText(/do you really want to delete this entry\?/i),
		).not.toBeInTheDocument();
	});
});
