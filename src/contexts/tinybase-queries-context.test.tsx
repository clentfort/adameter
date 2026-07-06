import { renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { TinyBaseTestWrapper } from '@/test-utils/tinybase-test-wrapper';
import {
	QUERY_IDS,
	TinybaseQueriesProvider,
	useTinybaseQueries,
} from './tinybase-queries-context';

describe('TinybaseQueriesContext', () => {
	it('should provide the queries infrastructure', () => {
		// 1. Verify QUERY_IDS constants
		expect(QUERY_IDS.GROWTH_HISTORY).toBe('growthHistory');

		// 2. Verify behavior outside of provider
		const { result: outsideResult } = renderHook(() => useTinybaseQueries());
		expect(outsideResult.current).toBeUndefined();

		// 3. Verify behavior inside of provider
		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<TinyBaseTestWrapper>
				<TinybaseQueriesProvider>{children}</TinybaseQueriesProvider>
			</TinyBaseTestWrapper>
		);

		const { result: insideResult } = renderHook(() => useTinybaseQueries(), {
			wrapper,
		});

		expect(insideResult.current).toBeDefined();
		expect(insideResult.current).not.toBeNull();
	});
});
