import { act, renderHook } from '@testing-library/react';
import { createStore } from 'tinybase';
import { Provider } from 'tinybase/ui-react';
import { describe, expect, it } from 'vitest';
import { I18nProvider } from '@/contexts/i18n-context';
import { useUnitSystem } from './use-unit-system';

const wrapper = ({ children }: { children: React.ReactNode }) => {
	const store = createStore();
	return (
		<Provider store={store}>
			<I18nProvider>{children}</I18nProvider>
		</Provider>
	);
};

describe('useUnitSystem', () => {
	it('should return default unit system based on locale', () => {
		const { result } = renderHook(() => useUnitSystem(), { wrapper });
		// Default locale is en-US, so it should be imperial
		expect(result.current[0]).toBe('imperial');
	});

	it('should allow updating unit system', () => {
		const { result } = renderHook(() => useUnitSystem(), { wrapper });

		act(() => {
			result.current[1]('metric');
		});

		expect(result.current[0]).toBe('metric');
	});
});
