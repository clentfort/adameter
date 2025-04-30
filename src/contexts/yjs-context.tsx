'use client';

import { createContext, useEffect, useState } from 'react';
import { proxy } from 'valtio';
import { bind } from 'valtio-yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { Doc } from 'yjs';
import { DiaperChange } from '@/types/diaper';
import { Event } from '@/types/event';
import { FeedingSession } from '@/types/feeding';
import { GrowthMeasurement } from '@/types/growth';

export interface State {
	diaperChanges: DiaperChange[];
	events: Event[];
	feedingSessions: FeedingSession[];
	growthMeasurements: GrowthMeasurement[];
}

const INITIAL_STATE: State = {
	diaperChanges: [],
	events: [],
	feedingSessions: [],
	growthMeasurements: [],
};

interface YjsContext {
	doc: Doc;
	persistence?: IndexeddbPersistence | undefined;
	state: State;
}
export const yjsContext = createContext<YjsContext>(
	(() => {
		const doc = new Doc();
		const persistence =
			typeof window !== 'undefined'
				? new IndexeddbPersistence('adameter', doc)
				: undefined;
		return {
			doc,
			persistence,
			state: INITIAL_STATE,
		};
	})(),
);

interface YjsProviderProps {
	children: React.ReactNode;
}
export function YjsProvider({ children }: YjsProviderProps) {
	const [doc] = useState(() => new Doc());
	const [state] = useState(() => proxy({}));
	const [persistence] = useState(() => {
		if (typeof window === 'undefined') {
			return undefined;
		}
		return new IndexeddbPersistence('adameter', doc);
	});
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const ymap = doc.getMap('state');
		let unbind: () => void | undefined;
		persistence?.whenSynced.then(() => {
			unbind = bind(state, ymap);
			setIsLoading(false);
		});

		return () => {
			unbind?.();
		};
	}, [doc, persistence, state]);

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<yjsContext.Provider value={{ doc, persistence, state }}>
			{children}
		</yjsContext.Provider>
	);
}
