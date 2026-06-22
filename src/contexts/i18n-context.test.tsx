import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { I18nContext, I18nProvider, useLanguage } from './i18n-context';

describe('I18nProvider', () => {
	it('should provide the default locale and update it when setLocale is called', async () => {
		const TestComponent = () => {
			const { locale, setLocale } = useLanguage();
			return (
				<div>
					<span data-testid="locale">{locale}</span>
					<button onClick={() => setLocale('de-DE')}>Change Locale</button>
				</div>
			);
		};

		render(
			<I18nProvider>
				<TestComponent />
			</I18nProvider>,
		);

		// Initial locale should be en-US (default)
		expect(screen.getByTestId('locale')).toHaveTextContent('en-US');

		// Click the button to change the locale
		await act(async () => {
			screen.getByText('Change Locale').click();
		});

		// Locale should update to de-DE
		expect(await screen.findByTestId('locale')).toHaveTextContent('de-DE');
	});

	it('should throw an error when context is missing (useLanguage error branch)', () => {
		const TestComponent = () => {
			useLanguage();
			return null;
		};

		// Prevent console.error from cluttering the output
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		// To trigger the !context branch, we need to wrap it in a Provider that provides null
		// or just call it outside of any provider.
		// Actually, useContext(I18nContext) will return the default value if no provider is present.
		// The default value for I18nContext is { locale: DEFAULT_LOCALE, setLocale: async () => {} }.
		// So it's never null by default.

		// To test the error branch, we can explicitly provide null to the context.
		expect(() => render(
			<I18nContext.Provider value={null as any}>
				<TestComponent />
			</I18nContext.Provider>
		)).toThrow(
			'useLanguage must be used within a LanguageProvider',
		);

		consoleSpy.mockRestore();
	});
});
