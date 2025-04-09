import type React from 'react';
import './globals.css';
import { Toaster } from '@/components/ui/toast';
import { LanguageProvider } from '@/contexts/language-context';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	description: 'An app for tracking baby activities',
	generator: 'v0.dev',
	title: 'Baby Tracker',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="de">
			<head>
				<meta content="width=device-width, initial-scale=1" name="viewport" />
			</head>
			<body className={inter.className}>
				<LanguageProvider>
					{children}
					<Toaster />
				</LanguageProvider>
			</body>
		</html>
	);
}
