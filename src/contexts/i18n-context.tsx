'use client';

import React, {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState,
} from 'react';
import { getPreferredLocale, Locale, setLocale as setAppLocale } from '@/i18n';

type I18nContextType = {
	locale: Locale;
	setLocale: (lang: Locale) => Promise<void>;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

type I18nProviderProps = {
	children: ReactNode;
};

export const I18nProvider = ({ children }: I18nProviderProps) => {
	const [locale, setLocaleState] = useState<Locale>(getPreferredLocale());

	// Refresh preferred locale on mount, as this happens only on the client
	useEffect(() => {
		setLocale(getPreferredLocale());
	}, []);

	const setLocale = async (locale: Locale) => {
		await setAppLocale(locale);
		setLocaleState(locale);
	};

	return (
		<I18nContext.Provider value={{ locale, setLocale }}>
			<React.Fragment key={locale}>{children}</React.Fragment>
		</I18nContext.Provider>
	);
};

export const useLanguage = (): I18nContextType => {
	const context = useContext(I18nContext);
	if (!context) {
		throw new Error('useLanguage must be used within a LanguageProvider');
	}
	return context;
};
