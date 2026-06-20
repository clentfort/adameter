import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getPreferredLocale, setLocale } from '@/i18n';
import { I18nContext, I18nProvider, useLanguage } from './i18n-context';

vi.mock('@/i18n', async (importOriginal) => {
	const actual = (await importOriginal()) as typeof import('@/i18n');
	return {
		...actual,
		getPreferredLocale: vi.fn(() => 'en-US'),
		setLocale: vi.fn(() => Promise.resolve()),
	};
});

describe('I18nContext', () => {
	it('should provide default locale', () => {
		const { result } = renderHook(() => useLanguage(), {
			wrapper: I18nProvider,
		});

		expect(result.current.locale).toBe('en-US');
	});

	it('should update locale when setLocale is called', async () => {
		const { result } = renderHook(() => useLanguage(), {
			wrapper: I18nProvider,
		});

		await act(async () => {
			await result.current.setLocale('de-DE');
		});

		expect(result.current.locale).toBe('de-DE');
		expect(setLocale).toHaveBeenCalledWith('de-DE');
	});

	it('should call setLocale with preferred locale on mount', () => {
		vi.mocked(getPreferredLocale).mockReturnValue('de-DE');

		renderHook(() => useLanguage(), {
			wrapper: I18nProvider,
		});

		expect(setLocale).toHaveBeenCalledWith('de-DE');
	});

	it('should throw error when useLanguage is used outside I18nProvider', () => {
		// To reach line 54, we need useContext(I18nContext) to return null.
		// We can achieve this by providing null as value in the Provider.

		const { result } = renderHook(
			() => {
				try {
					return useLanguage();
				} catch (error) {
					return error;
				}
			},
			{
				// @ts-expect-error - testing error branch
				wrapper: ({ children }) => (
					<I18nContext.Provider value={null}>{children}</I18nContext.Provider>
				),
			},
		);

		expect(result.current).toBeInstanceOf(Error);
		expect((result.current as Error).message).toBe(
			'useLanguage must be used within a LanguageProvider',
		);
	});
});
