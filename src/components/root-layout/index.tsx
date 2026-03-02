'use client';

import { fbt } from 'fbtee';
import { Settings } from 'lucide-react';
import Image from 'next/image';
import '@/i18n';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
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
	const [isCondensed, setIsCondensed] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			const threshold = 100;
			const scrollProgress = Math.min(
				1,
				Math.max(0, window.scrollY / threshold),
			);
			document.documentElement.style.setProperty(
				'--header-scroll-progress',
				scrollProgress.toString(),
			);
			setIsCondensed(window.scrollY >= threshold);
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		handleScroll(); // Initial call
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	const isSettingsPage = pathname === '/settings';

	return (
		<div className="flex flex-col min-h-screen items-center">
			{!isSettingsPage && (
				<header className="sticky top-0 z-50 w-full max-w-md mx-auto px-4 bg-background border-b border-transparent transition-colors duration-300">
					<div
						className="absolute inset-x-0 bottom-0 border-b pointer-events-none"
						style={{
							borderBottomColor:
								'color-mix(in srgb, var(--color-border) calc(var(--header-scroll-progress, 0) * 100%), transparent)',
						}}
					/>
					<div
						className="flex flex-col w-full relative"
						style={{
							paddingBottom:
								'calc(1.5rem - var(--header-scroll-progress, 0) * 1rem)',
							paddingTop:
								'calc(1rem - var(--header-scroll-progress, 0) * 0.5rem)',
						}}
					>
						<div
							className="overflow-hidden"
							style={{
								height: 'calc((1 - var(--header-scroll-progress, 0)) * 3rem)',
								marginBottom:
									'calc((1 - var(--header-scroll-progress, 0)) * 1.5rem)',
								marginTop:
									'calc((1 - var(--header-scroll-progress, 0)) * 1rem)',
								opacity: 'calc(1 - var(--header-scroll-progress, 0))',
							}}
						>
							<div
								className="flex justify-between items-center h-12"
								style={{
									transform:
										'translateY(calc(var(--header-scroll-progress, 0) * -20px))',
								}}
							>
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
									<Link href="/settings">
										<Button
											aria-label={fbt(
												'Settings',
												'Label for the settings button',
											)}
											data-testid="settings-button"
											size="icon"
											variant="outline"
										>
											<Settings className="h-5 w-5" />
										</Button>
									</Link>
								</div>
							</div>
						</div>

						<div
							className="overflow-hidden"
							style={{
								height: 'calc((1 - var(--header-scroll-progress, 0)) * 3rem)',
								marginBottom:
									'calc((1 - var(--header-scroll-progress, 0)) * 1.5rem)',
								opacity: 'calc(1 - var(--header-scroll-progress, 0))',
							}}
						>
							<div
								className="flex flex-row justify-between gap-2 h-12"
								style={{
									transform:
										'translateY(calc(var(--header-scroll-progress, 0) * -40px))',
								}}
							>
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

						<div className="flex items-center gap-2 w-full min-w-0">
							<div
								className="flex-shrink-0 overflow-hidden"
								style={{
									opacity: 'var(--header-scroll-progress, 0)',
									transform:
										'translateX(calc((1 - var(--header-scroll-progress, 0)) * -20px))',
									width: 'calc(var(--header-scroll-progress, 0) * 1.5rem)',
								}}
							>
								<Link href="/">
									<Image
										alt="AdaMeter Logo"
										className="rounded-full block h-6 w-6"
										height={24}
										src="/icon-96x96.png"
										width={24}
									/>
								</Link>
							</div>
							<div className="flex-grow min-w-0">
								<Navigation isCondensed={isCondensed} />
							</div>
						</div>
					</div>
				</header>
			)}
			<main
				className={cn(
					'flex flex-col items-center p-4 max-w-md mx-auto w-full flex-grow',
					!isSettingsPage && 'pt-0',
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
