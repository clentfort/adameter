import type React from 'react';
import './globals.css';
import type { Metadata } from 'next';
import RootLayout from '@/components/root-layout';
import '@/i18n';
import { ThemeProvider } from '@/components/theme-provider';
import { DataSynchronizationProvider } from '@/contexts/data-synchronization-context';
import { I18nProvider } from '@/contexts/i18n-context';
import { YjsProvider } from '@/contexts/yjs-context';

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
				<I18nProvider>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						disableTransitionOnChange
						enableSystem
					>
						<YjsProvider>
							<DataSynchronizationProvider>
								<RootLayout>{children}</RootLayout>
							</DataSynchronizationProvider>
						</YjsProvider>
					</ThemeProvider>
				</I18nProvider>
			</body>
		</html>
	);
}
