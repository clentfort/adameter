import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTeethSnapshot, useUpsertTooth } from '@/hooks/use-teething';
import TeethingProgress from './teething-progress';

vi.mock('@/hooks/use-teething', () => ({
	useTeethSnapshot: vi.fn(() => []),
	useUpsertTooth: vi.fn(() => vi.fn()),
}));

describe('TeethingProgress', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it('covers all components states including erupted teeth and form interactions', async () => {
		const mockUpsertTooth = vi.fn();
		vi.mocked(useUpsertTooth).mockReturnValue(mockUpsertTooth);
		vi.mocked(useTeethSnapshot).mockReturnValue([
			{ date: '2023-01-01', id: '51', notes: 'First tooth', toothId: 51 },
		]);

		render(<TeethingProgress />);

		// Verify erupted tooth state
		const tooth51 = screen.getByRole('button', { name: /51/i });
		expect(tooth51).toHaveClass('bg-primary');

		// Verify non-erupted tooth state in another quadrant (lower right)
		const tooth81 = screen.getByRole('button', { name: /81/i });
		expect(tooth81).toHaveClass('bg-muted');

		// Click to open form for 81
		fireEvent.click(tooth81);
		expect(
			screen.getByText(/lower right central incisor/i),
		).toBeInTheDocument();

		// Save the form
		fireEvent.click(screen.getByTestId('save-button'));
		await vi.waitFor(() => {
			expect(mockUpsertTooth).toHaveBeenCalled();
		});

		// Open erupted tooth form to clear
		fireEvent.click(tooth51);
		fireEvent.click(screen.getByRole('button', { name: /clear/i }));
		expect(mockUpsertTooth).toHaveBeenCalledWith(
			expect.objectContaining({
				date: undefined,
				notes: undefined,
				toothId: 51,
			}),
		);

		// Click upper left and lower left to cover remaining branches
		fireEvent.click(screen.getByRole('button', { name: /61/i }));
		expect(screen.getByText(/upper left central incisor/i)).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: /cancel|clear/i }));

		fireEvent.click(screen.getByRole('button', { name: /71/i }));
		expect(screen.getByText(/lower left central incisor/i)).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: /cancel|clear/i }));
	});
});
