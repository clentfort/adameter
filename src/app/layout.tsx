import type React from 'react';
import './globals.css';
import type { Metadata } from 'next';
import RootLayout from '@/components/root-layout';
import { Toaster } from '@/components/ui/toast';
import '@/i18n';
import { Provider } from 'jotai/react';
import { ThemeProvider } from '@/components/theme-provider';
import { I18nProvider } from '@/contexts/i18n-context';

export const metadata: Metadata = {
	description: 'An app for tracking baby activities',
	title: 'AdaMeter',
};

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html suppressHydrationWarning>
			<head>
				<meta content="width=device-width, initial-scale=1" name="viewport" />
				<link href="/manifest.json" rel="manifest" type="manifest" />
			</head>
			<body>
				<Provider>
					<I18nProvider>
						<ThemeProvider
							attribute="class"
							defaultTheme="system"
							disableTransitionOnChange
							enableSystem
						>
							<RootLayout>{children}</RootLayout>
						</ThemeProvider>
					</I18nProvider>
					<Toaster />
				</Provider>
			</body>
		</html>
	);
}
