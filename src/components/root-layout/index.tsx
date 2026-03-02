'use client';

import { fbt } from 'fbtee';
import { Settings } from 'lucide-react';
import Image from 'next/image';
import '@/i18n';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { useLatestDiaperChange } from '@/hooks/use-latest-diaper-change';
import { useLatestFeedingSession } from '@/hooks/use-latest-feeding-session';
import { cn } from '@/lib/utils';
import ProfilePrompt from '../profile-prompt';
import { Button } from '../ui/button';
import { Toaster } from '../ui/toaster';
import { Footer } from './footer';
import Navigation from './navigation';
import { RoomInviteHandler } from './room-invite-handler';
import TimeSince from './time-since';

interface RootLayoutProps {
	children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
	const latestFeedingSession = useLatestFeedingSession();
	const latestDiaperChange = useLatestDiaperChange();
	const pathname = usePathname();

	useEffect(() => {
		const handleScroll = () => {
			const threshold = 144;
			const scrollProgress = Math.min(
				1,
				Math.max(0, window.scrollY / threshold),
			);
			document.documentElement.style.setProperty(
				'--header-scroll-progress',
				scrollProgress.toString(),
			);
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		handleScroll(); // Initial call
		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	}, []);

	const isSettingsPage = pathname === '/settings';

	return (
		<div
			className="flex flex-col min-h-screen items-center"
			style={
				{
					'--header-height-expanded': '11.5rem',
					'--header-height-sticky': '3.5rem',
					'--logo-size': '3rem',
					'--logo-top-expanded': '1rem',
					'--logo-top-sticky': '0.25rem',
				} as React.CSSProperties
			}
		>
			{!isSettingsPage && (
				<header className="w-full max-w-md mx-auto z-50">
					{/* Expanded Header Content */}
					<div
						className="px-4 bg-background"
						style={{
							opacity: 'calc(1 - var(--header-scroll-progress, 0))',
						}}
					>
						<div className="flex justify-between items-center h-12 pt-4 mb-4">
							<div className="w-12 h-12 shrink-0" />
							<h1 className="text-2xl font-bold truncate px-2">AdaMeter</h1>
							<div className="flex items-center gap-2 shrink-0">
								<Link href="/settings">
									<Button
										aria-label={fbt(
											'Settings',
											'Label for the settings button',
										)}
										className="transition-none!"
										data-testid="settings-button"
										size="icon"
										variant="outline"
									>
										<Settings className="h-5 w-5" />
									</Button>
								</Link>
							</div>
						</div>

						<div className="flex flex-row justify-between gap-2 h-12 mb-4">
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
					</div>

					{/* Sticky Navigation Bar */}
					<div className="sticky top-0 h-14 bg-background px-4 z-50">
						<div
							className="absolute inset-x-0 bottom-0 border-b pointer-events-none"
							style={{
								borderBottomColor:
									'color-mix(in srgb, var(--color-border) calc(var(--header-scroll-progress, 0) * 100%), transparent)',
							}}
						/>
						<div className="flex items-center h-full gap-2">
							<div className="w-6 h-6 shrink-0" />
							<div className="flex-grow min-w-0">
								<Navigation />
							</div>
						</div>

						{/* Single Morphing Logo */}
						<div
							className="absolute left-4 z-20 pointer-events-auto will-change-transform"
							style={{
								top: 'var(--logo-top-sticky)',
								transform:
									'translateY(calc((1 - var(--header-scroll-progress, 0)) * (var(--logo-top-expanded) - var(--logo-top-sticky)))) translateY(calc((1 - var(--header-scroll-progress, 0)) * -1rem)) scale(calc(1 - var(--header-scroll-progress, 0) * 0.5))',
								transformOrigin: 'left top',
							}}
						>
							<Link href="/">
								<Image
									alt="AdaMeter Logo"
									className="rounded-full block shadow-sm h-12 w-12"
									height={48}
									src="/icon-96x96.png"
									width={48}
								/>
							</Link>
						</div>
					</div>
				</header>
			)}
			<main
				className={cn(
					'flex flex-col items-center p-4 max-w-md mx-auto w-full flex-grow',
				)}
			>
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
