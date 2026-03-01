'use client';

import { fbt } from 'fbtee';
import { ArrowLeft } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function SettingsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const pathname = usePathname();

	const isMainSettings = pathname === '/settings';

	const getTitle = () => {
		if (pathname.includes('/profile'))
			return fbt('Child Profile', 'Title for profile settings section');
		if (pathname.includes('/appearance'))
			return fbt('Appearance', 'Title for appearance settings section');
		if (pathname.includes('/sharing'))
			return fbt('Sharing', 'Title for sharing settings section');
		if (pathname.includes('/diapers'))
			return fbt('Diaper Products', 'Title for diaper products section');
		if (pathname.includes('/data'))
			return fbt('Data Management', 'Title for data settings section');
		return fbt('Settings', 'Title for settings page');
	};

	return (
		<div className="flex flex-col items-center w-full max-w-md mx-auto">
			<div className="w-full flex justify-between items-center mb-6">
				<Button
					data-testid="back-button"
					onClick={() => {
						if (isMainSettings) {
							router.back();
						} else {
							router.push('/settings');
						}
					}}
					size="icon"
					variant="outline"
				>
					<ArrowLeft className="h-4 w-4" />
					<span className="sr-only">Back</span>
				</Button>
				<h1 className="text-2xl font-bold">{getTitle()}</h1>
				<div className="w-10" />
			</div>

			{children}
		</div>
	);
}
