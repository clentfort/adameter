import type React from 'react';
import './globals.css';
import { RootLayout } from '@/components/root-layout';
import { Toaster } from '@/components/ui/toast';
import type { Metadata } from 'next';
import '@/i18n';

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
				<RootLayout>{children}</RootLayout>
				<Toaster />
			</body>
		</html>
	);
}
