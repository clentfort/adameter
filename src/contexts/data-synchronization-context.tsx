'use client';

import { createContext, Provider, useEffect, useRef, useState } from 'react';
import { IndexeddbPersistence } from 'y-indexeddb';
import YPartyKitProvider from 'y-partykit/provider';
import { Doc } from 'yjs';

export const DataSynchronizationContext = createContext(
	(room: string | undefined) => {},
);

interface DataSynchronizationProviderProps {
	children: React.ReactNode;
}
export function DataSynchronizationProvider({
	children,
}: DataSynchronizationProviderProps) {
	const [room, setRoom] = useState<string | undefined>();
	const [yDoc] = useState(() => new Doc());
	const [persistence, setPersistence] = useState<
		IndexeddbPersistence | undefined
	>();
	const [provider, setProvider] = useState<YPartyKitProvider | undefined>();

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		const persistence = new IndexeddbPersistence('adameter', yDoc);
		setPersistence(persistence);

		console.log({ persistence });

		return () => {
			setPersistence(undefined);
			persistence.destroy();
		};
	}, [yDoc]);

	useEffect(() => {
		if (!room) {
			return;
		}

		const provider = new YPartyKitProvider('localhost:1999', room, yDoc, {
			connect: true,
		});

		setProvider(provider);

		console.log({ provider });

		return () => {
			setProvider(undefined);
			provider.destroy();
		};
	}, [room, yDoc]);

	// const provider = useYProvider({
	// host: 'http://localhost:1999',
	// room,
	// });

	// useEffect(() => {
	// 	if (!provider) {
	// 		return;
	// 	}

	// 	const p = new IndexeddbPersistence('feeding', provider.doc);
	// }, [provider]);

	// useEffect(() => {
	// 	console.log('running effect becasue provider chagned');
	// 	console.log('from effect', provider.doc.getMap('feedingSessions'));
	// 	const m = provider.doc.getMap('feedingSessions');
	// 	const bla = setTimeout(() => {
	// 		console.log('running timeout', ++i);
	// 		m.set('test', (m.get('test') ?? 0) + 1);
	// 	}, 1000);

	// 	const handler = (...a) => console.log('handler', a, m.get('test'));
	// 	m.observe(handler);
	// 	console.log('test is', m.get('test'));

	// 	// const bla = setInterval(() => {
	// 	// 	m.set('test1', Math.random());
	// 	// }, 500);

	// 	return () => {
	// 		m.unobserve(handler);
	// 		clearTimeout(bla);
	// 		// clearInterval(bla);
	// 	};
	// }, [provider]);

	return (
		<DataSynchronizationContext.Provider value={setRoom}>
			{children}
		</DataSynchronizationContext.Provider>
	);
}
