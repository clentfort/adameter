import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EditIconButton from './edit';

describe('EditIconButton', () => {
	afterEach(() => {
		cleanup();
	});

	it('should render correctly and handle click events', async () => {
		const user = userEvent.setup();
		const onClick = vi.fn();

		render(<EditIconButton onClick={onClick} />);

		const button = screen.getByRole('button', { name: /edit/i });
		expect(button).toBeInTheDocument();

		await user.click(button);
		expect(onClick).toHaveBeenCalledTimes(1);
	});
});
