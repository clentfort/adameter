import type { DiaperChange } from '@/types/diaper';
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nContext } from '@/contexts/i18n-context';
import DiaperForm from './diaper-form';

const mockUpsert = vi.fn();

vi.mock('@/hooks/use-diaper-changes', () => ({
	useDiaperChangesSnapshot: () => [],
}));

vi.mock('@/hooks/use-diaper-products', () => ({
	useDiaperProduct: (productId: string | undefined) => {
		if (productId === 'archived-id') {
			return {
				archived: true,
				id: 'archived-id',
				isReusable: false,
				name: 'Archived Product',
			};
		}
		if (productId === 'non-existent') {
			return undefined;
		}
		return productId
			? { id: productId, isReusable: false, name: `Product ${productId}` }
			: undefined;
	},
	useFrecencySortedDiaperProductIds: () => [
		'1',
		'2',
		'archived-id',
		'non-existent',
	],
	useUpsertDiaperProduct: () => mockUpsert,
}));

describe('DiaperForm', () => {
	const mockOnSave = vi.fn();
	const mockOnClose = vi.fn();

	const baseProps = {
		onClose: mockOnClose,
		onSave: mockOnSave,
		title: 'Add Diaper Change',
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it('renders with initial data and calls onSave when submitted', async () => {
		const initialChange: DiaperChange = {
			containsStool: true,
			containsUrine: true,
			id: '1',
			leakage: false,
			notes: 'Some notes',
			pottyStool: false,
			pottyUrine: false,
			temperature: 37,
			timestamp: '2023-10-27T10:00:00.000Z',
		};

		render(<DiaperForm {...baseProps} change={initialChange} />);

		expect(screen.getByLabelText(/temperature/i)).toHaveValue(98.6);
		expect(screen.getByLabelText(/notes/i)).toHaveValue('Some notes');

		fireEvent.click(screen.getByTestId('save-button'));

		await waitFor(() => expect(mockOnSave).toHaveBeenCalledTimes(1));
		const savedChange = mockOnSave.mock.calls[0][0];
		expect(savedChange.containsStool).toBe(true);
		expect(savedChange.containsUrine).toBe(true);
		expect(savedChange.temperature).toBe(37);
		expect(savedChange.notes).toBe('Some notes');
		expect(savedChange.id).toBe('1');
	});

	it('allows toggling urine and stool', async () => {
		render(<DiaperForm {...baseProps} />);

		fireEvent.click(screen.getByTestId('toggle-diaper-urine'));
		fireEvent.click(screen.getByTestId('toggle-diaper-stool'));
		fireEvent.click(screen.getByTestId('save-button'));

		await waitFor(() => expect(mockOnSave).toHaveBeenCalledTimes(1));
		const savedChange = mockOnSave.mock.calls[0][0];
		expect(savedChange.containsUrine).toBe(false);
		expect(savedChange.containsStool).toBe(true);
	});

	it('renders temperature in Celsius for German locale', () => {
		const initialChange: DiaperChange = {
			containsStool: true,
			containsUrine: true,
			id: '1',
			leakage: false,
			notes: 'Some notes',
			pottyStool: false,
			pottyUrine: false,
			temperature: 36.5,
			timestamp: '2023-10-27T10:00:00.000Z',
		};

		render(
			<I18nContext.Provider
				value={{ locale: 'de-DE', setLocale: async () => {} }}
			>
				<DiaperForm {...baseProps} change={initialChange} />
			</I18nContext.Provider>,
		);

		expect(screen.getByLabelText(/temperature/i)).toHaveValue(36.5);
	});

	it('handles potty toggles, leakage, and abnormal temperature warning', async () => {
		render(
			<I18nContext.Provider
				value={{ locale: 'de-DE', setLocale: async () => {} }}
			>
				<DiaperForm {...baseProps} />
			</I18nContext.Provider>,
		);

		// Test potty toggles
		const pottyUrine = screen.getByTestId('toggle-potty-urine');
		const pottyStool = screen.getByTestId('toggle-potty-stool');
		fireEvent.click(pottyUrine);
		fireEvent.click(pottyStool);

		// Test leakage switch - use role switch to avoid multiple label matches if any
		const leakageSwitch = screen.getByRole('switch', { name: /leaked/i });
		fireEvent.click(leakageSwitch);

		// Test abnormal temperature warning
		const tempInput = screen.getByLabelText(/temperature/i);
		fireEvent.change(tempInput, { target: { value: '38.5' } });
		expect(
			screen.getByText(/warning: temperature outside normal range/i),
		).toBeInTheDocument();

		fireEvent.click(screen.getByTestId('save-button'));

		await waitFor(() => expect(mockOnSave).toHaveBeenCalledTimes(1));
		const savedChange = mockOnSave.mock.calls[0][0];
		expect(savedChange.pottyUrine).toBe(true);
		expect(savedChange.pottyStool).toBe(true);
		expect(savedChange.leakage).toBe(true);
		expect(savedChange.temperature).toBe(38.5);
	});

	it('opens and closes the add product dialog', async () => {
		render(<DiaperForm {...baseProps} />);

		const plusButton = document
			.querySelector('.lucide-plus')
			?.closest('button');
		expect(plusButton).toBeTruthy();
		fireEvent.click(plusButton!);

		const dialog = await screen.findByRole('dialog', { name: /add product/i });
		expect(dialog).toBeInTheDocument();

		const cancelButton = within(dialog).getByRole('button', {
			name: /cancel/i,
		});
		fireEvent.click(cancelButton);

		await waitFor(() => {
			expect(screen.queryByText(/add product/i)).not.toBeInTheDocument();
		});
	});

	it('allows adding a new product and selects it', async () => {
		const user = userEvent.setup();
		render(<DiaperForm {...baseProps} />);

		const plusButton = document
			.querySelector('.lucide-plus')
			?.closest('button');
		expect(plusButton).toBeTruthy();
		await user.click(plusButton!);

		const dialog = await screen.findByRole('dialog', { name: /add product/i });
		expect(dialog).toBeInTheDocument();

		const nameInput = within(dialog).getByLabelText(/product name/i);
		await user.type(nameInput, 'New Diaper');

		const saveButton = within(dialog).getByRole('button', { name: /save/i });
		await user.click(saveButton);

		await waitFor(() => {
			expect(mockUpsert).toHaveBeenCalledWith(
				expect.objectContaining({ name: 'New Diaper' }),
			);
		});

		await waitFor(() => {
			expect(screen.queryByText(/add product/i)).not.toBeInTheDocument();
		});
	});

	it('filters out archived products that are not selected or current', async () => {
		const user = userEvent.setup();
		render(<DiaperForm {...baseProps} />);

		const selectTrigger = screen.getByRole('combobox', { name: /product/i });
		await user.click(selectTrigger);

		expect(
			await screen.findByRole('option', { name: 'Product 1' }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole('option', { name: 'Archived Product' }),
		).not.toBeInTheDocument();
	});

	it('includes archived product when it is the current/selected product', async () => {
		const user = userEvent.setup();
		const initialChange: DiaperChange = {
			containsStool: true,
			containsUrine: true,
			diaperProductId: 'archived-id',
			id: '1',
			leakage: false,
			notes: '',
			pottyStool: false,
			pottyUrine: false,
			temperature: 37,
			timestamp: '2023-10-27T10:00:00.000Z',
		};

		render(<DiaperForm {...baseProps} change={initialChange} />);

		const selectTrigger = screen.getByRole('combobox', { name: /product/i });
		await user.click(selectTrigger);

		expect(
			await screen.findByRole('option', { name: 'Archived Product' }),
		).toBeInTheDocument();
	});

	it('allows selecting a product from the dropdown', async () => {
		const user = userEvent.setup();
		render(<DiaperForm {...baseProps} />);

		const selectTrigger = screen.getByRole('combobox', { name: /product/i });
		await user.click(selectTrigger);

		const option = await screen.findByRole('option', { name: 'Product 1' });
		await user.click(option);

		expect(selectTrigger).toHaveTextContent('Product 1');

		fireEvent.click(screen.getByTestId('save-button'));
		await waitFor(() => expect(mockOnSave).toHaveBeenCalledTimes(1));
		const savedChange = mockOnSave.mock.calls[0][0];
		expect(savedChange.diaperProductId).toBe('1');
	});

	it('closes the add product dialog when onOpenChange is triggered with false', async () => {
		const user = userEvent.setup();
		render(<DiaperForm {...baseProps} />);

		const plusButton = document
			.querySelector('.lucide-plus')
			?.closest('button');
		expect(plusButton).toBeTruthy();
		await user.click(plusButton!);

		const dialog = await screen.findByRole('dialog', { name: /add product/i });
		expect(dialog).toBeInTheDocument();

		// Trigger escape key on the dialog to simulate closing via onOpenChange(false)
		fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });

		await waitFor(() => {
			expect(screen.queryByText(/add product/i)).not.toBeInTheDocument();
		});
	});
});
