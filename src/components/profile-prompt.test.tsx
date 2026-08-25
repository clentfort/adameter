import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataSynchronizationContext } from '@/contexts/data-synchronization-context';
import ProfilePrompt from './profile-prompt';

const mocks = vi.hoisted(() => ({
	searchParams: new URLSearchParams(),
	setSelectedProfileId: vi.fn(),
	upsertProfile: vi.fn(),
}));

vi.mock('next/navigation', () => ({
	useSearchParams: () => mocks.searchParams,
}));

vi.mock('@/hooks/use-profile', () => ({
	useProfile: () => [null],
	useProfileIds: () => [],
	useUpsertProfile: () => mocks.upsertProfile,
}));

vi.mock('@/hooks/use-selected-profile-id', () => ({
	useSelectedProfileId: () => [undefined, mocks.setSelectedProfileId],
}));

function renderPrompt(room?: string) {
	return render(
		<DataSynchronizationContext.Provider
			value={{
				isHydrated: true,
				joinRoom: () => {},
				joinStrategy: 'merge',
				leaveRoom: () => {},
				resetJoinStrategy: () => {},
				room,
				setRoom: () => {},
			}}
		>
			<ProfilePrompt />
		</DataSynchronizationContext.Provider>,
	);
}

describe('ProfilePrompt', () => {
	beforeEach(() => {
		mocks.searchParams = new URLSearchParams();
	});

	it('shows setup for a new local app', async () => {
		renderPrompt();

		expect(
			await screen.findByRole('heading', { name: 'Welcome to AdaMeter!' }),
		).toBeVisible();
	});

	it('stays hidden while an existing room invitation is pending', () => {
		mocks.searchParams = new URLSearchParams('room=existing-room');
		renderPrompt();

		expect(
			screen.queryByRole('heading', { name: 'Welcome to AdaMeter!' }),
		).not.toBeInTheDocument();
	});

	it('handles saving a new profile', async () => {
		const user = userEvent.setup();
		renderPrompt();

		const nameInput = await screen.findByLabelText('Name');
		const dobInput = screen.getByLabelText('Date of Birth');

		await user.type(nameInput, 'Alex');
		await user.type(dobInput, '2023-01-01');

		const saveButton = screen.getByRole('button', { name: 'Save Profile' });
		await user.click(saveButton);

		expect(mocks.upsertProfile).toHaveBeenCalledWith(
			expect.objectContaining({
				dob: '2023-01-01',
				name: 'Alex',
				optedOut: false,
			}),
		);
		expect(mocks.setSelectedProfileId).toHaveBeenCalledWith(expect.any(String));
	});

	it('handles opting out of profile creation', async () => {
		const user = userEvent.setup();
		renderPrompt();

		const optOutButton = await screen.findByTestId('profile-opt-out-button');
		await user.click(optOutButton);

		expect(mocks.upsertProfile).toHaveBeenCalledWith(
			expect.objectContaining({
				optedOut: true,
			}),
		);
		expect(mocks.setSelectedProfileId).toHaveBeenCalledWith(expect.any(String));
	});
});
