import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ProductForm from './product-form';

describe('ProductForm', () => {
	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
	});

	it('should handle all form interactions including creation, editing, and cancellation', async () => {
		const user = userEvent.setup();
		const onSave = vi.fn();
		const onCancel = vi.fn();

		// Mock crypto.randomUUID for creation mode
		vi.stubGlobal('crypto', {
			randomUUID: () => 'generated-uuid',
		});

		// 1. Test creation mode
		const { rerender } = render(
			<ProductForm onCancel={onCancel} onSave={onSave} />,
		);

		// Fill in product name
		const nameInput = screen.getByLabelText(/product name/i);
		await user.type(nameInput, 'Test Diaper');

		// Fill in cost per diaper
		const costInput = screen.getByLabelText(/cost per diaper/i);
		await user.type(costInput, '0.50');

		// Toggle reusable
		const reusableSwitch = screen.getByRole('switch', {
			name: /reusable diaper/i,
		});
		await user.click(reusableSwitch);

		// Fill in upfront cost (only appears when reusable is checked)
		const upfrontCostInput = screen.getByLabelText(/upfront cost/i);
		await user.type(upfrontCostInput, '20.00');

		// Fill in notes
		const notesInput = screen.getByLabelText(/notes \(optional\)/i);
		await user.type(notesInput, 'Some notes');

		// Click save
		const saveButton = screen.getByRole('button', { name: /save/i });
		await user.click(saveButton);

		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({
				costPerDiaper: 0.5,
				id: 'generated-uuid',
				isReusable: true,
				name: 'Test Diaper',
				notes: 'Some notes',
				upfrontCost: 20,
			}),
		);
		onSave.mockClear();

		// 2. Test editing mode
		const initialData = {
			color: '#ff0000',
			costPerDiaper: 0.25,
			id: 'existing-id',
			isReusable: false,
			name: 'Old Name',
			notes: 'Old Notes',
		};

		await act(async () => {
			rerender(
				<ProductForm
					initialData={initialData}
					onCancel={onCancel}
					onSave={onSave}
				/>,
			);
		});

		expect(screen.getByDisplayValue('Old Name')).toBeInTheDocument();
		expect(screen.getByDisplayValue('0.25')).toBeInTheDocument();
		expect(screen.getByDisplayValue('Old Notes')).toBeInTheDocument();

		// Change name and save
		await user.clear(nameInput);
		await user.type(nameInput, 'New Name');
		await user.click(screen.getByRole('button', { name: /save/i }));

		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({
				color: '#ff0000',
				id: 'existing-id',
				isReusable: false,
				name: 'New Name',
			}),
		);

		// 3. Test cancellation
		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		await user.click(cancelButton);
		expect(onCancel).toHaveBeenCalled();

		// 4. Test toggling reusable OFF clears upfront cost
		await user.click(reusableSwitch); // Toggle reusable ON
		const updatedUpfrontCostInput = screen.getByLabelText(/upfront cost/i);
		await user.type(updatedUpfrontCostInput, '10');
		await user.click(reusableSwitch); // Toggle reusable OFF
		await user.click(screen.getByRole('button', { name: /save/i }));

		expect(onSave).toHaveBeenLastCalledWith(
			expect.objectContaining({
				isReusable: false,
				upfrontCost: undefined,
			}),
		);
	});
});
