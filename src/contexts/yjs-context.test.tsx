import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import React, { useContext, useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as Yjs from 'yjs';
import { Array as YArray, Doc as YDoc, Map as YMap } from 'yjs';
import {
	IndexeddbPersistence as MockPersistence,
	resetIndexeddbMock,
	storeState,
	triggerWhenSynced,
} from '../__mocks__/y-indexeddb';
import { yjsContext, YjsProvider } from './yjs-context';

vi.mock('y-indexeddb');

vi.mock('yjs', async (importOriginal) => {
	const actual = (await importOriginal()) as typeof import('yjs');
	return {
		...actual,
		encodeStateAsUpdate: vi.fn(actual.encodeStateAsUpdate),
	};
});

vi.mock('valtio-yjs', () => ({
	bind: vi.fn(() => vi.fn()),
}));

describe('YjsProvider', () => {
	afterEach(() => {
		cleanup();
	});

	beforeEach(async () => {
		vi.clearAllMocks();
		resetIndexeddbMock();
		localStorage.clear();
		(MockPersistence.prototype as any)._dbsize = 0;
		vi.mocked(Yjs.encodeStateAsUpdate).mockReturnValue(new Uint8Array(10));

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
		let receivedDoc: YDoc | null = null;

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
		expect(receivedDoc).toBeInstanceOf(YDoc);
		expect(receivedDoc!.guid).toBeTruthy();
	});

	it('should call storeState when _dbsize > 20', async () => {
		// Set _dbsize on the prototype so all instances have it
		(MockPersistence.prototype as any)._dbsize = 21;

		render(
			<YjsProvider>
				<div />
			</YjsProvider>,
		);

		await act(async () => {
			triggerWhenSynced();
		});

		await waitFor(() => {
			expect(storeState).toHaveBeenCalledWith(expect.any(MockPersistence), true);
		});
	});

	it('should initiate migration when document size exceeds threshold', async () => {
		vi.useFakeTimers();
		const mockedEncode = vi.mocked(Yjs.encodeStateAsUpdate);

		let currentEpoch = 0;
		const EpochConsumer = () => {
			const { epoch } = useContext(yjsContext);
			currentEpoch = epoch;
			return null;
		};

		render(
			<YjsProvider>
				<EpochConsumer />
			</YjsProvider>,
		);

		await act(async () => {
			triggerWhenSynced();
		});

		expect(currentEpoch).toBe(1);

		// Now make it return a large buffer
		mockedEncode.mockReturnValueOnce(new Uint8Array(600 * 1024));

		await act(async () => {
			vi.advanceTimersByTime(60000);
		});

		expect(currentEpoch).toBe(2);
		expect(localStorage.getItem('adameter-epoch')).toBe('2');

		vi.useRealTimers();
	});

	it('should follow migration signal from other clients', async () => {
		let capturedDoc: YDoc | null = null;
		let currentEpoch = 0;

		const Consumer = () => {
			const { doc, epoch } = useContext(yjsContext);
			useEffect(() => {
				capturedDoc = doc;
				currentEpoch = epoch;
			}, [doc, epoch]);
			return <div data-testid="epoch-display">{epoch}</div>;
		};

		render(
			<YjsProvider>
				<Consumer />
			</YjsProvider>,
		);

		await act(async () => {
			triggerWhenSynced();
		});

		expect(screen.getByTestId('epoch-display')).toHaveTextContent('1');
		expect(currentEpoch).toBe(1);

		await act(async () => {
			capturedDoc!.getMap('meta').set('migratedTo', 2);
		});

		await waitFor(
			() => {
				expect(screen.getByTestId('epoch-display')).toHaveTextContent('2');
				expect(currentEpoch).toBe(2);
			},
			{ timeout: 2000 },
		);
		expect(localStorage.getItem('adameter-epoch')).toBe('2');
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

		expect(ValtioYjsMocked.bind).toHaveBeenCalledWith(
			diaperChangesData.diaperChanges,
			expect.any(YArray),
		);
		expect(ValtioYjsMocked.bind).toHaveBeenCalledWith(
			eventsData.events,
			expect.any(YArray),
		);
		expect(ValtioYjsMocked.bind).toHaveBeenCalledWith(
			feedingSessionsData.feedingSessions,
			expect.any(YArray),
		);
		expect(ValtioYjsMocked.bind).toHaveBeenCalledWith(
			growthMeasurementsData.growthMeasurements,
			expect.any(YArray),
		);
		expect(ValtioYjsMocked.bind).toHaveBeenCalledWith(
			feedingInProgressData.feedingInProgress,
			expect.any(YMap),
		);
		expect(ValtioYjsMocked.bind).toHaveBeenCalledWith(
			medicationRegimensData.medicationRegimensProxy,
			expect.any(YArray),
		);
		expect(ValtioYjsMocked.bind).toHaveBeenCalledWith(
			medicationsData.medicationsProxy,
			expect.any(YArray),
		);
		expect(ValtioYjsMocked.bind).toHaveBeenCalledTimes(7);
	});
});
