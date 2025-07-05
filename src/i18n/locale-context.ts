'use client';

import { createLocaleContext } from 'fbtee';
import { DEFAULT_LOCALE, ALL_LOCALES, setLocale as setAppLocale } from './index'; // Assuming i18n/index.ts exists or will be created

export const { LocaleProvider, useLocale } = createLocaleContext({
  defaultLocale: DEFAULT_LOCALE,
  availableLocales: ALL_LOCALES,
  setGlobalLocale: setAppLocale, // fbtee will call this when locale changes
});
