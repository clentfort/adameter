import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { describe, expect, it, vi } from 'vitest';
import { SettingsHeader } from './settings-header';

vi.mock('next/navigation', () => ({
	useRouter: vi.fn(),
}));

describe('SettingsHeader', () => {
	it('should render the title', () => {
		render(<SettingsHeader title="Test Title" />);
		expect(screen.getByText('Test Title')).toBeDefined();
	});

	it('should call onBack when provided and back button is clicked', async () => {
		const onBack = vi.fn();
		render(<SettingsHeader onBack={onBack} title="Test Title" />);

		const backButton = screen.getByTestId('back-button');
		await userEvent.click(backButton);

		expect(onBack).toHaveBeenCalledTimes(1);
	});

	it('should call router.push("/settings") when onBack is not provided and back button is clicked', async () => {
		const push = vi.fn();
		vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);

		render(<SettingsHeader title="Test Title" />);

		const backButton = screen.getByTestId('back-button');
		await userEvent.click(backButton);

		expect(push).toHaveBeenCalledWith('/settings');
	});
});
