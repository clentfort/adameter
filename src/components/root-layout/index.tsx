'use client';

import Image from 'next/image';
import '@/i18n';
import Link from 'next/link';
import { useDiaperChanges } from '@/hooks/use-diaper-changes';
import { useFeedingSessions } from '@/hooks/use-feeding-sessions';
import DataSharingSwitcher from './data-sharing-switcher';
import LanguageSwitcher from './language-switcher';
import Navigation from './navigation';
import ThemeSwitcher from './theme-switcher';
import TimeSince from './time-since';

interface RootLayoutProps {
	children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
	const { value: sessions } = useFeedingSessions();
	const { value: diaperChanges } = useDiaperChanges();

	return (
		<main className="flex min-h-screen flex-col items-center p-4 max-w-md mx-auto">
			<div className="w-full flex justify-between items-center mb-6 mt-4">
				<span className="relative w-12 h-12">
					<Link href="/">
						<Image
							alt="AdaMeter Logo"
							className="rounded-full block h-full w-full"
							height={96}
							src="/icon-96x96.png"
							width={96}
						/>
					</Link>
				</span>
				<h1 className="text-2xl font-bold">AdaMeter</h1>
				<div className="flex items-center gap-2">
					<LanguageSwitcher />
					<ThemeSwitcher />
					<DataSharingSwitcher />
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
