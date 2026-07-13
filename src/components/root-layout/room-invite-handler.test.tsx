import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataSynchronizationContext } from '@/contexts/data-synchronization-context';
import { RoomInviteHandler } from './room-invite-handler';

vi.mock('next/navigation', () => ({
	useRouter: vi.fn(),
	useSearchParams: vi.fn(),
}));

vi.mock('./join-room-dialog', () => ({
	JoinRoomDialog: vi.fn(({ onCancel, onJoin, roomId }) => (
		<div data-testid="join-room-dialog">
			<span>Join Room: {roomId}</span>
			<button onClick={onCancel}>Cancel</button>
			<button onClick={onJoin}>Join</button>
		</div>
	)),
}));

vi.mock('./leave-room-warning-dialog', () => ({
	LeaveRoomWarningDialog: vi.fn(({ onCancel, onConfirm }) => (
		<div data-testid="leave-room-warning-dialog">
			<span>Leave Room Warning</span>
			<button onClick={onCancel}>Cancel</button>
			<button onClick={onConfirm}>Confirm</button>
		</div>
	)),
}));

const mockUseRouter = vi.mocked(useRouter);
const mockUseSearchParams = vi.mocked(useSearchParams);

describe('RoomInviteHandler', () => {
	const mockReplace = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		mockUseRouter.mockReturnValue({
			replace: mockReplace,
		} as unknown as ReturnType<typeof useRouter>);

		// Default: no room in URL
		mockUseSearchParams.mockReturnValue(new URLSearchParams() as any);

		// Mock window.location
		const mockLocation = new URL('https://example.com/page?room=test-room');
		vi.stubGlobal('location', mockLocation);
	});

	it('should do nothing if no room param is present', () => {
		render(
			<DataSynchronizationContext.Provider
				// @ts-expect-error partial mock
				value={{ room: undefined }}
			>
				<RoomInviteHandler />
			</DataSynchronizationContext.Provider>,
		);

		expect(screen.queryByTestId('join-room-dialog')).not.toBeInTheDocument();
		expect(
			screen.queryByTestId('leave-room-warning-dialog'),
		).not.toBeInTheDocument();
	});

	it('should show JoinRoomDialog when room param is present and no current room', () => {
		mockUseSearchParams.mockReturnValue(
			new URLSearchParams('room=test-room') as any,
		);

		render(
			<DataSynchronizationContext.Provider
				// @ts-expect-error partial mock
				value={{ room: undefined }}
			>
				<RoomInviteHandler />
			</DataSynchronizationContext.Provider>,
		);

		expect(screen.getByTestId('join-room-dialog')).toBeInTheDocument();
		expect(screen.getByText('Join Room: test-room')).toBeInTheDocument();
		expect(
			screen.queryByTestId('leave-room-warning-dialog'),
		).not.toBeInTheDocument();
	});

	it('should show LeaveRoomWarningDialog when room param is present and is different from current room', () => {
		mockUseSearchParams.mockReturnValue(
			new URLSearchParams('room=new-room') as any,
		);

		render(
			<DataSynchronizationContext.Provider
				// @ts-expect-error partial mock
				value={{ room: 'current-room' }}
			>
				<RoomInviteHandler />
			</DataSynchronizationContext.Provider>,
		);

		expect(screen.getByTestId('leave-room-warning-dialog')).toBeInTheDocument();
		expect(screen.queryByTestId('join-room-dialog')).not.toBeInTheDocument();
	});

	it('should show JoinRoomDialog after confirming LeaveRoomWarningDialog', async () => {
		mockUseSearchParams.mockReturnValue(
			new URLSearchParams('room=new-room') as any,
		);

		render(
			<DataSynchronizationContext.Provider
				// @ts-expect-error partial mock
				value={{ room: 'current-room' }}
			>
				<RoomInviteHandler />
			</DataSynchronizationContext.Provider>,
		);

		fireEvent.click(screen.getByText('Confirm'));

		await waitFor(() => {
			expect(screen.getByTestId('join-room-dialog')).toBeInTheDocument();
		});
		expect(screen.getByText('Join Room: new-room')).toBeInTheDocument();
	});

	it('should clear URL param when cancelling JoinRoomDialog', async () => {
		mockUseSearchParams.mockReturnValue(
			new URLSearchParams('room=test-room') as any,
		);

		render(
			<DataSynchronizationContext.Provider
				// @ts-expect-error partial mock
				value={{ room: undefined }}
			>
				<RoomInviteHandler />
			</DataSynchronizationContext.Provider>,
		);

		fireEvent.click(screen.getByText('Cancel'));

		await waitFor(() => {
			expect(screen.queryByTestId('join-room-dialog')).not.toBeInTheDocument();
		});
		expect(mockReplace).toHaveBeenCalledWith('/page');
	});

	it('should clear URL param when joining in JoinRoomDialog', async () => {
		mockUseSearchParams.mockReturnValue(
			new URLSearchParams('room=test-room') as any,
		);

		render(
			<DataSynchronizationContext.Provider
				// @ts-expect-error partial mock
				value={{ room: undefined }}
			>
				<RoomInviteHandler />
			</DataSynchronizationContext.Provider>,
		);

		fireEvent.click(screen.getByText('Join'));

		await waitFor(() => {
			expect(screen.queryByTestId('join-room-dialog')).not.toBeInTheDocument();
		});
		expect(mockReplace).toHaveBeenCalledWith('/page');
	});
});
