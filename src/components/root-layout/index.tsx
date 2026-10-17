'use client';

import '@/i18n';
import { usePathname } from 'next/navigation';
import { Suspense, useRef } from 'react';
import { BackupReminder } from '../backup-reminder';
import ConsoleDebugger from '../console-debugger';
import ProfilePrompt from '../profile-prompt';
import { Toaster } from '../ui/toaster';
import { CollapsingHeader } from './collapsing-header';
import { Footer } from './footer';
import { RoomInviteHandler } from './room-invite-handler';
import { useHeaderScrollProgress } from './use-header-scroll-progress';

interface RootLayoutProps {
	children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
	const pathname = usePathname();
	const containerRef = useRef<HTMLDivElement>(null);

	const isSettingsPage = pathname.startsWith('/settings');

	useHeaderScrollProgress(containerRef);

	return (
		<div
			className="flex flex-col min-h-screen items-center"
			ref={containerRef}
			style={{ '--header-scroll-progress': '0' } as React.CSSProperties}
		>
			<main className="flex flex-col items-center max-w-md mx-auto w-full flex-grow">
				{!isSettingsPage && <CollapsingHeader />}
				<div
					className="px-4 pb-4 w-full"
					style={{ paddingTop: 'var(--header-content-gap)' }}
				>
					<Suspense fallback={null}>
						<RoomInviteHandler />
						<ProfilePrompt />
					</Suspense>
					{children}
				</div>
			</main>
			<ConsoleDebugger />
			<BackupReminder />
			<Toaster />
			<Footer />
		</div>
	);
}
