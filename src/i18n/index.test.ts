import { setDefaultOptions } from 'date-fns';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS } from '../lib/storage';
import { DEFAULT_LOCALE, getPreferredLocale, setLocale } from './index';

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
		localStorageMock.setItem(STORAGE_KEYS.PREFERRED_LANGUAGE, 'de_DE');
		expect(getPreferredLocale()).toBe('de_DE');

		localStorageMock.clear();
		vi.stubGlobal('navigator', { language: 'de-DE' });
		expect(getPreferredLocale()).toBe('de_DE');

		vi.stubGlobal('navigator', { language: 'fr-FR' });
		expect(getPreferredLocale()).toBe(DEFAULT_LOCALE);

		// Test setLocale functionality
		await setLocale('de_DE');
		expect(localStorageMock.setItem).toHaveBeenCalledWith(
			STORAGE_KEYS.PREFERRED_LANGUAGE,
			'de_DE',
		);
		expect(setDefaultOptions).toHaveBeenCalled();

		vi.clearAllMocks();
		// @ts-expect-error - testing invalid locale
		await setLocale('fr_FR');
		expect(localStorageMock.setItem).not.toHaveBeenCalled();
		expect(setDefaultOptions).not.toHaveBeenCalled();
	});
});
