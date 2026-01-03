'use client';

import PartySocket from 'partysocket';
import { createStore } from 'tinybase';
import { createPartyKitPersister } from 'tinybase/persisters/persister-partykit-client';
import {
	Provider,
	useCreatePersister,
	useCreateStore,
} from 'tinybase/ui-react';

interface YjsProviderProps {
	children: React.ReactNode;
}

export function YjsProvider({ children }: YjsProviderProps) {
	const store = useCreateStore(() => {
		return createStore().setTables({
			'diaper-changes': {},
			'events': {},
			'feeding-sessions': {},
			'measurements': {},
		});
	});

	const roomId = 'test-party';

	const PARTYKIT_HOST = '192.168.178.22:1999';

	useCreatePersister(
		store,
		(store) => {
			if (!roomId) {
				return;
			}

			return createPartyKitPersister(
				store,
				new PartySocket({ host: PARTYKIT_HOST, room: roomId }),
				location.protocol.slice(0, -1) as 'http' | 'https',
			);
		},
		[roomId],
		async (persister) => {
			if (!persister) {
				return;
			}

			await persister.startAutoSave();
			await persister.startAutoLoad();
		},
	);

	return <Provider store={store}>{children}</Provider>;
}
