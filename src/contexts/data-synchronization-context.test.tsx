import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import YPartyKitProvider from 'y-partykit/provider';
import { Doc } from 'yjs';
import { DataSynchronizationProvider } from './data-synchronization-context';
import { yjsContext } from './yjs-context';

vi.mock('y-partykit/provider');

describe('DataSynchronizationProvider', () => {
	it('should use versioned room name based on epoch', () => {
		const doc = new Doc();
		const epoch = 3;
		localStorage.setItem('room', 'test-room');

		render(
			<yjsContext.Provider value={{ doc, epoch }}>
				<DataSynchronizationProvider>
					<div />
				</DataSynchronizationProvider>
			</yjsContext.Provider>,
		);

		expect(YPartyKitProvider).toHaveBeenCalledWith(
			expect.any(String),
			'test-room-v3',
			doc,
			expect.any(Object),
		);
	});
});
