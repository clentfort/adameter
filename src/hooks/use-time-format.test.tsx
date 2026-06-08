import { act, renderHook } from '@testing-library/react';
import { createStore } from 'tinybase';
import { Provider } from 'tinybase/ui-react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLanguage } from '@/contexts/i18n-context';
import { STORE_VALUE_TIME_FORMAT } from '@/lib/tinybase-sync/constants';
import { useTimeFormat } from './use-time-format';

vi.mock('@/contexts/i18n-context', () => ({
	useLanguage: vi.fn(),
}));

describe('useTimeFormat', () => {
	let store: ReturnType<typeof createStore>;

	beforeEach(() => {
		store = createStore();
		vi.mocked(useLanguage).mockReturnValue({
			locale: 'en-US',
			setLocale: vi.fn(),
		});
	});

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<Provider store={store}>{children}</Provider>
	);

	it('defaults to 12h for en-US locale', () => {
		const { result } = renderHook(() => useTimeFormat(), { wrapper });
		expect(result.current[0]).toBe('12h');
	});

	it('defaults to 24h for other locales', () => {
		vi.mocked(useLanguage).mockReturnValue({
			locale: 'de-DE',
			setLocale: vi.fn(),
		});
		const { result } = renderHook(() => useTimeFormat(), { wrapper });
		expect(result.current[0]).toBe('24h');
	});

	it('returns value from store if set', () => {
		store.setValue(STORE_VALUE_TIME_FORMAT, '24h');
		const { result } = renderHook(() => useTimeFormat(), { wrapper });
		expect(result.current[0]).toBe('24h');
	});

	it('updates store when setter is called', () => {
		const { result } = renderHook(() => useTimeFormat(), { wrapper });
		act(() => {
			result.current[1]('24h');
		});
		expect(store.getValue(STORE_VALUE_TIME_FORMAT)).toBe('24h');
		expect(result.current[0]).toBe('24h');
	});
});
