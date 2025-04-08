'use client';

import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from 'react';
import type { Locale } from '@/i18n';

interface LanguageContextType {
	language: Locale;
	setLanguage: (language: Locale) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
	undefined,
);

export function LanguageProvider({ children }: { children: ReactNode }) {
	const [language, setLanguage] = useState<Locale>('de');
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		// Check if language is stored in localStorage
		const storedLanguage = localStorage.getItem('language') as Locale;

		if (
			storedLanguage &&
			(storedLanguage === 'de' || storedLanguage === 'en')
		) {
			setLanguage(storedLanguage);
		} else {
			// Detect browser language
			const browserLanguage = navigator.language.split('-')[0];
			setLanguage(browserLanguage === 'de' ? 'de' : 'en');
		}

		setIsLoaded(true);
	}, []);

	useEffect(() => {
		// Only save to localStorage after initial load
		if (isLoaded) {
			localStorage.setItem('language', language);
		}
	}, [language, isLoaded]);

	return (
		<LanguageContext.Provider value={{ language, setLanguage }}>
			{children}
		</LanguageContext.Provider>
	);
}

export function useLanguage() {
	const context = useContext(LanguageContext);
	if (context === undefined) {
		throw new Error('useLanguage must be used within a LanguageProvider');
	}
	return context;
}
