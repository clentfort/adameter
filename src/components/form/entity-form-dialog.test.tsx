import { zodResolver } from '@hookform/resolvers/zod';
import { fireEvent, render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { EntityFormDialog } from './entity-form-dialog';

const schema = z.object({ name: z.string() });

function TestDialog({
	onClose,
	onSave,
}: {
	onClose: () => void;
	onSave: (data: { name: string }, event?: React.BaseSyntheticEvent) => void;
}) {
	const form = useForm({
		defaultValues: { name: 'test' },
		resolver: zodResolver(schema),
	});
	return (
		<EntityFormDialog
			form={form}
			onClose={onClose}
			onSave={onSave}
			title="Test Dialog"
		>
			<input {...form.register('name')} aria-label="name-input" />
		</EntityFormDialog>
	);
}

describe('EntityFormDialog', () => {
	it('renders title and children', () => {
		const onSave = vi.fn();
		const onClose = vi.fn();
		render(<TestDialog onClose={onClose} onSave={onSave} />);

		expect(screen.getByText('Test Dialog')).toBeInTheDocument();
		expect(screen.getByLabelText('name-input')).toBeInTheDocument();
	});

	it('calls onSave when save button is clicked', async () => {
		const onSave = vi.fn();
		const onClose = vi.fn();
		render(<TestDialog onClose={onClose} onSave={onSave} />);

		fireEvent.click(screen.getByTestId('save-button'));

		// useForm handleSubmit is async
		await vi.waitFor(() => {
			expect(onSave).toHaveBeenCalledWith({ name: 'test' }, expect.anything());
		});
	});

	it('calls onClose when cancel button is clicked', () => {
		const onSave = vi.fn();
		const onClose = vi.fn();
		render(<TestDialog onClose={onClose} onSave={onSave} />);

		fireEvent.click(screen.getByText(/cancel/i));
		expect(onClose).toHaveBeenCalled();
	});

	it('renders custom footer and handles onOpenChange', () => {
		const onSave = vi.fn();
		const onClose = vi.fn();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const form = { handleSubmit: vi.fn() } as any;

		const { unmount } = render(
			<EntityFormDialog
				footer={<div data-testid="custom-footer">Custom Footer</div>}
				form={form}
				onClose={onClose}
				onSave={onSave}
				title="Custom Footer Dialog"
			>
				<div>Content</div>
			</EntityFormDialog>,
		);

		expect(screen.getByTestId('custom-footer')).toBeInTheDocument();

		// Trigger onOpenChange(false) which should call onClose()
		// Since Dialog is from @base-ui/react, we can try to trigger it via Escape key
		fireEvent.keyDown(screen.getByRole('dialog'), {
			code: 'Escape',
			key: 'Escape',
		});

		expect(onClose).toHaveBeenCalled();
		unmount();
	});
});
