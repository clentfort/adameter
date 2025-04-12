import type React from 'react';
import './globals.css';
import { RootLayout } from '@/components/root-layout';
import { Toaster } from '@/components/ui/toast';
import { LanguageProvider } from '@/contexts/language-context';
import type { Metadata } from 'next';
import '@/i18n';

export const metadata: Metadata = {
	description: 'An app for tracking baby activities',
	generator: 'v0.dev',
	title: 'Baby Tracker',
};

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="de">
			<head>
				<meta content="width=device-width, initial-scale=1" name="viewport" />
			</head>
			<body>
				<LanguageProvider>
					<RootLayout>{children}</RootLayout>
					<Toaster />
				</LanguageProvider>
			</body>
		</html>
	);
}
