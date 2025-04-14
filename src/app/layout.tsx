import type React from 'react';
import './globals.css';
import type { Metadata } from 'next';
import RootLayout from '@/components/root-layout';
import { Toaster } from '@/components/ui/toast';
import '@/i18n';
import { I18nProvider } from '@/contexts/i18n-context';

export const metadata: Metadata = {
	description: 'An app for tracking baby activities',
	title: 'AdaMeter',
};

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html>
			<head>
				<meta content="width=device-width, initial-scale=1" name="viewport" />
			</head>
			<body>
				<I18nProvider>
					<RootLayout>{children}</RootLayout>
				</I18nProvider>
				<Toaster />
			</body>
		</html>
	);
}
