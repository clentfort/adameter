import React, { useMemo } from 'react';
import { createStore, type Store } from 'tinybase';
import { Provider } from 'tinybase/ui-react';

export function createTestStore() {
	return createStore();
}

export function TinyBaseTestWrapper({
	children,
	store,
}: {
	children: React.ReactNode;
	store?: Store;
}) {
	const testStore = useMemo(() => store ?? createTestStore(), [store]);
	return <Provider store={testStore}>{children}</Provider>;
}
