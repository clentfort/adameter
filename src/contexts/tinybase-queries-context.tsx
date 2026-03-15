'use client';

import type { Queries } from 'tinybase';
import { createContext, useContext } from 'react';
import { createQueries } from 'tinybase';
import { useCreateQueries,  } from "tinybase/ui-react";
import { useTinybaseStore } from "@/hooks/use-tinybase-store";
import { } from '@/hooks/use-tinybase-store';

export const QUERY_IDS = {
	GROWTH_HISTORY: 'growthHistory',
} as const;

export const TinybaseQueriesContext = createContext<{
	queries: Queries | undefined;
}>({
	queries: undefined,
});

interface TinybaseQueriesProviderProps {
	children: React.ReactNode;
}

export function TinybaseQueriesProvider({
	children,
}: TinybaseQueriesProviderProps) {
	const store = useTinybaseStore();

	const queries = useCreateQueries(store, (store) => {
		const queries = createQueries(store);

		// Growth history query could go here if UNION-like behavior was possible.
		// For now, this provides the infrastructure for future queries.

		return queries;
	});

	return (
		<TinybaseQueriesContext.Provider value={{ queries }}>
			{children}
		</TinybaseQueriesContext.Provider>
	);
}

export function useTinybaseQueries() {
	const context = useContext(TinybaseQueriesContext);
	return context.queries;
}
