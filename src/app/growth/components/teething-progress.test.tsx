import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

	it('renders tooth icons and opens form on click', async () => {
		render(<TeethingProgress />);

		// Check if a tooth FDI number is present (e.g., 51)
		const tooth51 = screen.getByRole('button', { name: /51/i });
		expect(tooth51).toBeInTheDocument();

		// Click the tooth to open the form
		fireEvent.click(tooth51);

		// Verify that the tooth name "Upper Right Central Incisor" is displayed in the form
		// (Based on FDI 51 = Upper Right Central Incisor)
		expect(
			screen.getByText(/upper right central incisor/i),
		).toBeInTheDocument();

		// Verify the save button is present in the form
		expect(screen.getByTestId('save-button')).toBeInTheDocument();
	});
});
