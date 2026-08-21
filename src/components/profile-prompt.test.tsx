import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataSynchronizationContext } from '@/contexts/data-synchronization-context';
import ProfilePrompt from './profile-prompt';

const mocks = vi.hoisted(() => ({
	searchParams: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
	useSearchParams: () => mocks.searchParams,
}));

vi.mock('@/hooks/use-profile', () => ({
	useProfile: () => [null],
	useProfileIds: () => [],
	useUpsertProfile: () => vi.fn(),
}));

vi.mock('@/hooks/use-selected-profile-id', () => ({
	useSelectedProfileId: () => [undefined, vi.fn()],
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
});
