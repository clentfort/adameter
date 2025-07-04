'use client';

import React, {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState,
} from 'react';
import {
	DEFAULT_LOCALE,
	getPreferredLocale,
	Locale,
	setLocale as setAppLocale,
} from '@/i18n';
import dynamic from 'next/dynamic';

const LocaleContext = dynamic(() => import('@/lib/fbtee-client').then((mod) => mod.LocaleContext), {
	ssr: false,
	loading: () => null,
});

type I18nContextType = {
	locale: Locale;
	setLocale: (lang: Locale) => Promise<void>;
};

export const I18nContext = createContext<I18nContextType>({
	locale: DEFAULT_LOCALE,
	setLocale: async () => {},
});

type I18nProviderProps = {
	children: ReactNode;
};

export const I18nProvider = ({ children }: I18nProviderProps) => {
	const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

	// Refresh preferred locale on mount, as this happens only on the client
	useEffect(() => {
		setLocale(getPreferredLocale());
	}, []);

	const setLocale = async (locale: Locale) => {
		await setAppLocale(locale);
		setLocaleState(locale);
	};

	return (
		<LocaleContext>
			<I18nContext.Provider value={{ locale, setLocale }}>
				{children}
			</I18nContext.Provider>
		</LocaleContext>
	);
};

export const useLanguage = (): I18nContextType => {
	const context = useContext(I18nContext);
	if (!context) {
		throw new Error('useLanguage must be used within a LanguageProvider');
	}
	return context;
};
