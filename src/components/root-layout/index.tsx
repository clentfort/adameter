'use client';

import { fbt } from 'fbtee';
import { Settings } from 'lucide-react';
import Image from 'next/image';
import '@/i18n';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';
import { useLatestDiaperChangeRecord } from '@/hooks/use-diaper-changes';
import { useLatestFeedingSessionRecord } from '@/hooks/use-feeding-sessions';
import { useShowFeeding } from '@/hooks/use-show-feeding';
import ConsoleDebugger from '../console-debugger';
import ProfilePrompt from '../profile-prompt';
import { Button } from '../ui/button';
import { Toaster } from '../ui/toaster';
import DiaperStats from './diaper-stats';
import { Footer } from './footer';
import Navigation from './navigation';
import { RoomInviteHandler } from './room-invite-handler';
import TimeSince from './time-since';

interface RootLayoutProps {
	children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
	const latestFeedingSession = useLatestFeedingSessionRecord();
	const latestDiaperChange = useLatestDiaperChangeRecord();
	const [showFeeding] = useShowFeeding();
	const pathname = usePathname();
	const containerRef = useRef<HTMLDivElement>(null);

	const isSettingsPage = pathname.startsWith('/settings');

	useEffect(() => {
		const handleScroll = () => {
			if (!containerRef.current) return;
			const scrollThreshold = 144;
			const scrollY = window.scrollY;
			const progress = Math.min(1, Math.max(0, scrollY / scrollThreshold));
			containerRef.current.style.setProperty(
				'--header-scroll-progress',
				progress.toString(),
			);
		};

		window.addEventListener('scroll', handleScroll);
		handleScroll(); // Initial call
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	return (
		<div
			className="flex flex-col min-h-screen items-center"
			ref={containerRef}
			style={{ '--header-scroll-progress': '0' } as React.CSSProperties}
		>
			<main className="flex flex-col items-center max-w-md mx-auto w-full flex-grow">
				{!isSettingsPage && (
					<div
						className="sticky top-0 z-50 w-full flex flex-col bg-background !transition-none"
						style={
							{
								height: `calc(var(--header-height-expanded) - (var(--header-height-expanded) - var(--header-height-sticky)) * var(--header-scroll-progress))`,
							} as React.CSSProperties
						}
					>
						<div
							className="absolute z-50 !transition-none"
							style={
								{
									height: `calc(var(--logo-size-expanded) - (var(--logo-size-expanded) - var(--logo-size-sticky)) * var(--header-scroll-progress))`,
									left: `calc(var(--logo-left-expanded) + (var(--logo-left-sticky) - var(--logo-left-expanded)) * var(--header-scroll-progress))`,
									top: `calc(var(--logo-top-expanded) + (var(--logo-top-sticky) - var(--logo-top-expanded)) * var(--header-scroll-progress))`,
									width: `calc(var(--logo-size-expanded) - (var(--logo-size-expanded) - var(--logo-size-sticky)) * var(--header-scroll-progress))`,
								} as React.CSSProperties
							}
						>
							<Link href="/">
								<Image
									alt="AdaMeter Logo"
									className="rounded-full block h-full w-full"
									height={96}
									src="/icon-96x96.png"
									width={96}
								/>
							</Link>
						</div>

						<div
							className="w-full !transition-none"
							style={{
								height: `calc(10px * var(--header-scroll-progress))`,
							}}
						/>

						<div
							className="relative flex-grow flex items-center justify-between px-4 !transition-none"
							style={{
								marginTop: `calc(1rem * (1 - var(--header-scroll-progress)))`,
								maxHeight: `calc(48px * (1 - var(--header-scroll-progress)))`,
								overflow: 'hidden',
							}}
						>
							<div className="w-full flex justify-between items-center">
								<div className="w-12 h-12 shrink-0" />
								<h1
									className="text-2xl font-bold !transition-none"
									style={{
										opacity: `calc(1 - var(--header-scroll-progress))`,
										transform: `translateY(calc(-20px * var(--header-scroll-progress)))`,
									}}
								>
									AdaMeter
								</h1>
								<div
									className="flex items-center gap-2 !transition-none"
									style={{
										opacity: `calc(1 - var(--header-scroll-progress))`,
										transform: `translateY(calc(-20px * var(--header-scroll-progress)))`,
									}}
								>
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
							className="w-full flex flex-row justify-between gap-2 px-4 !transition-none"
							style={{
								marginBottom: `calc(0.25rem * (1 - var(--header-scroll-progress)))`,
								maxHeight: `calc(56px * (1 - var(--header-scroll-progress)))`,
								opacity: `calc(1 - var(--header-scroll-progress))`,
								overflow: 'hidden',
								transform: `translateY(calc(-20px * var(--header-scroll-progress)))`,
							}}
						>
							{showFeeding && (
								<TimeSince
									icon="🍼"
									lastChange={latestFeedingSession?.endTime || null}
								>
									<fbt desc="Short label indicating when a feeding was last recorded">
										Last Feeding
									</fbt>
								</TimeSince>
							)}

							<TimeSince
								icon="👶"
								lastChange={latestDiaperChange?.timestamp || null}
							>
								<fbt desc="A short label indicating when a diaper was last changed">
									Last Diaper Change
								</fbt>
							</TimeSince>

							{!showFeeding && <DiaperStats />}
						</div>
						<div className="px-4">
							<Navigation />
						</div>
					</div>
				)}
				<div
					className="px-4 pb-4 w-full"
					style={{ paddingTop: 'var(--header-content-gap)' }}
				>
					<Suspense fallback={null}>
						<RoomInviteHandler />
					</Suspense>
					<ProfilePrompt />
					{children}
				</div>
			</main>
			<ConsoleDebugger />
			<Toaster />
			<Footer />
		</div>
	);
}
