import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DeleteIconButton from './delete';

describe('DeleteIconButton', () => {
	it('renders correctly', () => {
		const onClick = vi.fn();
		render(<DeleteIconButton onClick={onClick} />);

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
		expect(screen.getByText('Delete')).toBeInTheDocument();
		expect(button).toHaveClass('text-destructive');
	});

	it('calls onClick when clicked', () => {
		const onClick = vi.fn();
		render(<DeleteIconButton onClick={onClick} />);

		const button = screen.getByRole('button');
		fireEvent.click(button);

		expect(onClick).toHaveBeenCalledTimes(1);
	});
});
