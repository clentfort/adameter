'use client';

import Image from 'next/image';
import '@/i18n';
import Link from 'next/link';
import { Suspense } from 'react';
import { useLatestDiaperChange } from '@/hooks/use-latest-diaper-change';
import { useLatestFeedingSession } from '@/hooks/use-latest-feeding-session';
import ProfilePrompt from '../profile-prompt';
import { Toaster } from '../ui/toaster';
import DataSharingSwitcher from './data-sharing-switcher';
import { Footer } from './footer';
import LanguageSwitcher from './language-switcher';
import Navigation from './navigation';
import { RoomInviteHandler } from './room-invite-handler';
import ThemeSwitcher from './theme-switcher';
import TimeSince from './time-since';

interface RootLayoutProps {
	children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
	const latestFeedingSession = useLatestFeedingSession();
	const latestDiaperChange = useLatestDiaperChange();

	return (
		<div className="flex flex-col min-h-screen items-center">
			<main className="flex flex-col items-center p-4 max-w-md mx-auto w-full flex-grow">
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
					<TimeSince
						icon="🍼"
						lastChange={latestFeedingSession?.endTime || null}
					>
						<fbt desc="Short label indicating when a feeding was last recorded">
							Last Feeding
						</fbt>
					</TimeSince>

					<TimeSince
						icon="👶"
						lastChange={latestDiaperChange?.timestamp || null}
					>
						<fbt desc="A short label indicating when a diaper was last changed">
							Last Diaper Change
						</fbt>
					</TimeSince>
				</div>
				<Navigation />
				<Suspense fallback={null}>
					<RoomInviteHandler />
				</Suspense>
				<ProfilePrompt />
				{children}
			</main>
			<Toaster />
			<Footer />
		</div>
	);
}
