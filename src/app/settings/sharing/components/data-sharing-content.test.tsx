import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataSynchronizationContext } from '@/contexts/data-synchronization-context';
import { DataSharingContent } from './data-sharing-content';

describe('DataSharingContent', () => {
	it('renders join and create room tabs when not connected to a room', () => {
		render(
			<DataSynchronizationContext.Provider
				value={{
					isHydrated: true,
					joinRoom: vi.fn(),
					joinStrategy: 'merge',
					leaveRoom: vi.fn(),
					resetJoinStrategy: vi.fn(),
					room: undefined,
					setRoom: vi.fn(),
				}}
			>
				<DataSharingContent />
			</DataSynchronizationContext.Provider>,
		);

		expect(screen.getByText('Join room')).toBeInTheDocument();
		expect(screen.getByText('Create room')).toBeInTheDocument();
	});

	it('calls leaveRoom when Leave Room button is clicked while connected', async () => {
		const leaveRoomMock = vi.fn();
		const user = userEvent.setup();

		render(
			<DataSynchronizationContext.Provider
				value={{
					isHydrated: true,
					joinRoom: vi.fn(),
					joinStrategy: 'merge',
					leaveRoom: leaveRoomMock,
					resetJoinStrategy: vi.fn(),
					room: 'test-room-123',
					setRoom: vi.fn(),
				}}
			>
				<DataSharingContent />
			</DataSynchronizationContext.Provider>,
		);

		expect(screen.getByTestId('settings-room-name')).toHaveTextContent(
			'test-room-123',
		);

		const leaveButton = screen.getByRole('button', { name: 'Leave Room' });
		await user.click(leaveButton);

		expect(leaveRoomMock).toHaveBeenCalledTimes(1);
	});
});
