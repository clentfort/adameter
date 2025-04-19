'use client';

import { useAppState } from '@/hooks/use-app-state';
import LanguageSwitcher from './language-switcher';
import { Navigation } from './navigation';
import TimeSince from './time-since';
import '@/i18n';
import Image from 'next/image';
import { ModeToggle } from './theme-switcher';

interface RootLayoutProps {
	children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
	const { diaperChanges, isLoading, sessions } = useAppState();

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p>
					<fbt desc="Loading indicator">Loading</fbt>
				</p>
			</div>
		);
	}

	return (
		<main className="flex min-h-screen flex-col items-center p-4 max-w-md mx-auto">
			<div className="w-full flex justify-between items-center mb-6 mt-4">
				<span className="relative w-12 h-12">
					<Image
						alt="AdaMeter Logo"
						className="rounded-full block h-full w-full"
						height={96}
						src="/icon-96x96.png"
						width={96}
					/>
				</span>
				<h1 className="text-2xl font-bold">AdaMeter</h1>
				<div className="flex items-center gap-2">
					<LanguageSwitcher />
					<ModeToggle />
				</div>
			</div>

			<div className="w-full flex flex-row justify-between gap-2 mb-6">
				<TimeSince icon="🍼" lastChange={sessions[0]?.endTime || null}>
					<fbt desc="Short label indicating when a feeding was last recorded">
						Last Feeding
					</fbt>
				</TimeSince>

				<TimeSince icon="👶" lastChange={diaperChanges[0]?.timestamp || null}>
					<fbt desc="A short label indicating when a diaper was last changed">
						Last Diaper Change
					</fbt>
				</TimeSince>
			</div>
			<Navigation />
			{children}
		</main>
	);
}
