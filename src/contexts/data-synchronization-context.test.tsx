import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import YPartyKitProvider from 'y-partykit/provider';
import { Doc } from 'yjs';
import { DataSynchronizationProvider } from './data-synchronization-context';
import { yjsContext } from './yjs-context';

vi.mock('y-partykit/provider', () => {
	return {
		default: vi.fn().mockImplementation(function () {
			return {
				destroy: vi.fn(),
			};
		}),
	};
});

describe('DataSynchronizationProvider', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
	});

	it('should use versioned room name for epochs > 1', () => {
		const doc = new Doc();
		localStorage.setItem('room', 'my-room');

		const { rerender } = render(
			<yjsContext.Provider value={{ doc, epoch: 1 }}>
				<DataSynchronizationProvider>
					<div />
				</DataSynchronizationProvider>
			</yjsContext.Provider>,
		);

		expect(YPartyKitProvider).toHaveBeenCalledWith(
			expect.any(String),
			'my-room',
			doc,
			expect.any(Object),
		);

		rerender(
			<yjsContext.Provider value={{ doc, epoch: 2 }}>
				<DataSynchronizationProvider>
					<div />
				</DataSynchronizationProvider>
			</yjsContext.Provider>,
		);

		expect(YPartyKitProvider).toHaveBeenCalledWith(
			expect.any(String),
			'my-room-v2',
			doc,
			expect.any(Object),
		);
	});
});
