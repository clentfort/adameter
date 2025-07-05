import type React from 'react';
import './globals.css'; // Keep for minimal Tailwind
import type { Metadata } from 'next';
import { LocaleProvider } from '@/i18n/locale-context'; // Use the new LocaleProvider
import '@/i18n'; // Initializes fbtee setup and default locale

export const metadata: Metadata = {
	description: 'A minimal Next.js app with fbtee and date-fns',
	title: 'Minimal App',
};

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		// `lang` attribute will be dynamically updated by LocaleProvider if it handles that,
		// otherwise, we might need to set it manually based on useLocale().
		// For simplicity, fbtee's createLocaleContext doesn't directly manage the <html> lang attribute.
		// We'll rely on client-side rendering for language changes.
		<html suppressHydrationWarning>
			<head>
				<meta content="width=device-width, initial-scale=1" name="viewport" />
				{/* Favicon and manifest can be kept if desired, or removed if not */}
				<link href="/favicon.ico" rel="icon" sizes="any" />
				<link href="/manifest.json" rel="manifest" />
			</head>
			<body>
				<LocaleProvider>
					{/* No ThemeProvider, YjsProvider, DataSynchronizationProvider, or old RootLayout */}
					<main>{children}</main>
				</LocaleProvider>
			</body>
		</html>
	);
}
