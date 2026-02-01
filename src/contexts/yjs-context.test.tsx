import { act, cleanup, render, screen } from '@testing-library/react';
import React, { useContext, useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as Yjs from 'yjs';
import {
	resetIndexeddbMock,
	triggerWhenSynced,
} from '../__mocks__/y-indexeddb';
import { yjsContext, YjsProvider } from './yjs-context';

vi.mock('y-indexeddb');

vi.mock('yjs', async () => {
	const actual = await vi.importActual<typeof import('yjs')>('yjs');
	return {
		...actual,
		encodeStateAsUpdate: vi.fn(actual.encodeStateAsUpdate),
	};
});

vi.mock('valtio-yjs', () => ({
	bind: vi.fn(() => vi.fn()),
}));

vi.mock('@/lib/client-id', () => ({
	getOrCreateClientId: vi.fn(() => 'test-client-id'),
}));

describe('YjsProvider', () => {
	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	beforeEach(async () => {
		vi.clearAllMocks();
		resetIndexeddbMock();
		localStorage.clear();
		vi.useFakeTimers();

		const ValtioYjsMocked = await import('valtio-yjs');
		(ValtioYjsMocked.bind as ReturnType<typeof vi.fn>).mockImplementation(() =>
			vi.fn(),
		);
	});

	it.skip('should show SplashScreen initially and then render children after sync', async () => {
		const InlineTestConsumer = () => {
			const { doc } = useContext(yjsContext);
			return <div data-testid="doc-id">{doc ? doc.guid : 'loading'}</div>;
		};

		const { getByAltText, queryByRole, queryByTestId } = render(
			<YjsProvider>
				<InlineTestConsumer />
			</YjsProvider>,
		);

		expect(getByAltText('AdaMeter Logo')).toBeInTheDocument();
		expect(queryByTestId('doc-id')).not.toBeInTheDocument();

		await act(async () => {
			triggerWhenSynced();
		});

		expect(
			queryByRole('img', { name: 'AdaMeter Logo' }),
		).not.toBeInTheDocument();
		expect(queryByTestId('doc-id')).toBeInTheDocument();
	});

	it('should provide a Yjs.Doc instance through context', async () => {
		let receivedDoc: Yjs.Doc | null = null;

		const DocCapturingConsumer = () => {
			const { doc } = useContext(yjsContext);
			useEffect(() => {
				receivedDoc = doc;
			}, [doc]);
			return (
				<div data-testid="doc-captured">
					{receivedDoc ? receivedDoc.guid : 'loading'}
				</div>
			);
		};

		render(
			<YjsProvider>
				<DocCapturingConsumer />
			</YjsProvider>,
		);

		await act(async () => {
			triggerWhenSynced();
		});

		expect(screen.getByTestId('doc-captured')).toBeInTheDocument();
		expect(receivedDoc).not.toBeNull();
		expect(receivedDoc).toBeInstanceOf(Yjs.Doc);
		expect(receivedDoc!.guid).toBeTruthy();
	});

	it('should initialize with epoch from localStorage', async () => {
		localStorage.setItem('adameter-epoch', '3');

		let receivedEpoch: number | null = null;
		const EpochCapturingConsumer = () => {
			const { epoch } = useContext(yjsContext);
			useEffect(() => {
				receivedEpoch = epoch;
			}, [epoch]);
			return null;
		};

		render(
			<YjsProvider>
				<EpochCapturingConsumer />
			</YjsProvider>,
		);

		await act(async () => {
			triggerWhenSynced();
		});

		expect(receivedEpoch).toBe(3);
	});

	it('should trigger compaction when size threshold is exceeded', async () => {
		const { encodeStateAsUpdate } = await import('yjs');
		(encodeStateAsUpdate as ReturnType<typeof vi.fn>).mockReturnValueOnce(
			new Uint8Array(600 * 1024),
		);

		render(
			<YjsProvider>
				<div />
			</YjsProvider>,
		);

		await act(async () => {
			triggerWhenSynced();
		});

		expect(localStorage.getItem('adameter-epoch')).toBe('2');
		(encodeStateAsUpdate as ReturnType<typeof vi.fn>).mockRestore();
	});

	it('should migrate when meta map is updated by another client', async () => {
		let currentDoc: Yjs.Doc | null = null;
		let currentEpoch: number | null = null;

		const Consumer = () => {
			const { doc, epoch } = useContext(yjsContext);
			currentDoc = doc;
			currentEpoch = epoch;
			return null;
		};

		render(
			<YjsProvider>
				<Consumer />
			</YjsProvider>,
		);

		await act(async () => {
			triggerWhenSynced();
		});

		const firstDoc = currentDoc!;
		expect(currentEpoch).toBe(1);

		await act(async () => {
			firstDoc
				.getMap('meta')
				.set('migratedTo', { epoch: 3, seederId: 'other-client' });
		});

		expect(currentEpoch).toBe(3);
		expect(currentDoc).not.toBe(firstDoc);
		expect(localStorage.getItem('adameter-epoch')).toBe('3');
	});

	it('should preserve unsynced changes and avoid duplicates during migration', async () => {
		const diaperChangesData = await import('@/data/diaper-changes');
		diaperChangesData.diaperChanges.length = 0;
		diaperChangesData.diaperChanges.push({ id: 'unsynced-1' } as any);
		diaperChangesData.diaperChanges.push({ id: 'already-in-yjs' } as any);

		let currentDoc: Yjs.Doc | null = null;
		const Consumer = () => {
			const { doc, setNetworkSynced } = useContext(yjsContext);
			currentDoc = doc;
			useEffect(() => {
				// Simulate network sync
				setNetworkSynced(true);
			}, [setNetworkSynced]);
			return null;
		};

		render(
			<YjsProvider>
				<Consumer />
			</YjsProvider>,
		);

		await act(async () => {
			triggerWhenSynced();
		});

		const firstDoc = currentDoc!;

		await act(async () => {
			// Simulate another client compacting and seeding the new doc
			firstDoc
				.getMap('meta')
				.set('migratedTo', { epoch: 2, seederId: 'other-client' });
		});

		// At this point we are in Epoch 2, but doc state is empty until sync
		await act(async () => {
			currentDoc!.getArray('diaper-changes-dec').push([{ id: 'already-in-yjs' }]);
			triggerWhenSynced();
		});

		// Wait for the binding grace period
		await act(async () => {
			vi.runAllTimers();
		});

		// 'already-in-yjs' should be deduplicated (removed from Valtio)
		// 'unsynced-1' should be preserved
		expect(diaperChangesData.diaperChanges).toContainEqual({ id: 'unsynced-1' });
		expect(diaperChangesData.diaperChanges).not.toContainEqual({
			id: 'already-in-yjs',
		});
		expect(diaperChangesData.diaperChanges.length).toBe(1);

		// Verify Yjs still has its item
		const yItems = currentDoc!.getArray('diaper-changes-dec').toArray();
		expect(yItems).toContainEqual({ id: 'already-in-yjs' });
	});

	it('should call bind for all data stores', async () => {
		const ValtioYjsMocked = await import('valtio-yjs');
		const diaperChangesData = await import('@/data/diaper-changes');
		const eventsData = await import('@/data/events');
		const feedingSessionsData = await import('@/data/feeding-sessions');
		const growthMeasurementsData = await import('@/data/growth-measurments');
		const feedingInProgressData = await import('@/data/feeding-in-progress');
		const medicationRegimensData = await import('@/data/medication-regimens');
		const medicationsData = await import('@/data/medications');

		// Render YjsProvider with a minimal child for this test
		render(
			<YjsProvider>
				<div />
			</YjsProvider>,
		);

		await act(async () => {
			triggerWhenSynced();
		});

		await act(async () => {
			vi.runAllTimers();
		});

		expect(ValtioYjsMocked.bind).toHaveBeenCalledWith(
			diaperChangesData.diaperChanges,
			expect.any(Yjs.Array),
		);
		expect(ValtioYjsMocked.bind).toHaveBeenCalledWith(
			eventsData.events,
			expect.any(Yjs.Array),
		);
		expect(ValtioYjsMocked.bind).toHaveBeenCalledWith(
			feedingSessionsData.feedingSessions,
			expect.any(Yjs.Array),
		);
		expect(ValtioYjsMocked.bind).toHaveBeenCalledWith(
			growthMeasurementsData.growthMeasurements,
			expect.any(Yjs.Array),
		);
		expect(ValtioYjsMocked.bind).toHaveBeenCalledWith(
			feedingInProgressData.feedingInProgress,
			expect.any(Yjs.Map),
		);
		expect(ValtioYjsMocked.bind).toHaveBeenCalledWith(
			medicationRegimensData.medicationRegimensProxy,
			expect.any(Yjs.Array),
		);
		expect(ValtioYjsMocked.bind).toHaveBeenCalledWith(
			medicationsData.medicationsProxy,
			expect.any(Yjs.Array),
		);
		expect(ValtioYjsMocked.bind).toHaveBeenCalledTimes(7);
	});
});
