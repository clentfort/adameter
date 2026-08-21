import { setDefaultOptions } from 'date-fns';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS } from '../lib/storage';
import { DEFAULT_LOCALE, getPreferredLocale, setLocale } from './index';

vi.mock('fbtee', async (importOriginal) => {
	const actual = await importOriginal<typeof import('fbtee')>();
	return {
		...actual,
		setupFbtee: vi.fn((config) => {
			(globalThis as unknown as Record<string, unknown>).capturedHooks =
				config.hooks;
			actual.setupFbtee(config);
		}),
	};
});

vi.mock('./translations.json', () => ({
	default: {
		'de-DE': {},
		'en-US': {},
		'fr-FR': {},
	},
}));

vi.mock('date-fns', async (importOriginal) => {
	const actual = await importOriginal<typeof import('date-fns')>();
	return {
		...actual,
		setDefaultOptions: vi.fn(),
	};
});

describe('i18n', () => {
	const localStorageMock = (() => {
		let store: Record<string, string> = {};
		return {
			clear: vi.fn(() => {
				store = {};
			}),
			getItem: vi.fn((key: string) => store[key] || null),
			removeItem: vi.fn((key: string) => {
				delete store[key];
			}),
			setItem: vi.fn((key: string, value: string) => {
				store[key] = value.toString();
			}),
		};
	})();

	beforeEach(() => {
		vi.stubGlobal('localStorage', localStorageMock);
		localStorageMock.clear();
		vi.clearAllMocks();
		vi.stubGlobal('navigator', { language: 'en-US' });
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('should correctly manage preferred locale and update system settings', async () => {
		// Test getPreferredLocale fallback logic
		localStorageMock.setItem(STORAGE_KEYS.PREFERRED_LANGUAGE, 'de-DE');
		expect(getPreferredLocale()).toBe('de-DE');

		localStorageMock.clear();
		vi.stubGlobal('navigator', { language: 'de-DE' });
		expect(getPreferredLocale()).toBe('de-DE');

		vi.stubGlobal('navigator', { language: 'it-IT' });
		expect(getPreferredLocale()).toBe(DEFAULT_LOCALE);

		// Test setLocale functionality
		await setLocale('de-DE');
		expect(localStorageMock.setItem).toHaveBeenCalledWith(
			STORAGE_KEYS.PREFERRED_LANGUAGE,
			'de-DE',
		);
		expect(setDefaultOptions).toHaveBeenCalled();

		vi.clearAllMocks();
		// @ts-expect-error - testing invalid locale
		await setLocale('it-IT');
		expect(localStorageMock.setItem).not.toHaveBeenCalled();
		expect(setDefaultOptions).not.toHaveBeenCalled();
	});

	it('should support en-US locale and load its date-fns locale', async () => {
		await setLocale('en-US');
		expect(localStorageMock.setItem).toHaveBeenCalledWith(
			STORAGE_KEYS.PREFERRED_LANGUAGE,
			'en-US',
		);
		expect(setDefaultOptions).toHaveBeenCalled();
	});

	it('should return the viewer context in fbtee hook and update it when locale changes', async () => {
		const capturedHooks = (
			globalThis as unknown as Record<
				string,
				{ getViewerContext: () => { GENDER: unknown; locale: string } }
			>
		).capturedHooks;
		expect(capturedHooks).toBeDefined();
		const context1 = capturedHooks.getViewerContext();
		expect(context1.locale).toBe('en-US');
		expect(context1.GENDER).toBeDefined();

		await setLocale('de-DE');
		const context2 = capturedHooks.getViewerContext();
		expect(context2.locale).toBe('de-DE');
		expect(context2.GENDER).toBeDefined();
	});

	it('should handle locales with no dateFnsLocale defined by returning early', async () => {
		// fr-FR is supported (via our mock) but has no dateFnsLocale loader defined
		// @ts-expect-error - testing mock supported locale missing in real type definitions
		await setLocale('fr-FR');
		expect(localStorageMock.setItem).toHaveBeenCalledWith(
			STORAGE_KEYS.PREFERRED_LANGUAGE,
			'fr-FR',
		);

		vi.clearAllMocks();
		// @ts-expect-error - testing mock supported locale missing in real type definitions
		await setLocale('fr-FR');
		expect(setDefaultOptions).not.toHaveBeenCalled();
	});
});
