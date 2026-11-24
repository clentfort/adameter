import type { RoomSyncStatus as Status } from '@/lib/tinybase-sync/room-sync';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RoomSyncStatusContext } from '@/contexts/room-sync-status-context';
import { RoomSyncStatus } from './room-sync-status';

function renderWithStatus(status: Status | undefined) {
	return render(
		<RoomSyncStatusContext.Provider value={status}>
			<RoomSyncStatus />
		</RoomSyncStatusContext.Provider>,
	);
}

describe('RoomSyncStatus', () => {
	it('renders nothing outside a room', () => {
		renderWithStatus(undefined);

		expect(screen.queryByRole('status')).not.toBeInTheDocument();
	});

	it('tells the user that changes stay on the device while offline', () => {
		renderWithStatus('offline');

		expect(screen.getByRole('status')).toHaveTextContent(
			'Changes are saved on this device',
		);
	});

	it('shows when all changes are synced', () => {
		renderWithStatus('synced');

		expect(screen.getByRole('status')).toHaveTextContent('All changes synced');
	});
});
