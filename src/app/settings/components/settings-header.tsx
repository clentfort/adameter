'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface SettingsHeaderProps {
	onBack?: () => void;
	title: React.ReactNode;
}

export function SettingsHeader({ onBack, title }: SettingsHeaderProps) {
	const router = useRouter();

	const handleBack = () => {
		if (onBack) {
			onBack();
		} else {
			router.push('/settings');
		}
	};

	return (
		<div className="w-full flex justify-between items-center mb-6">
			<Button
				data-testid="back-button"
				onClick={handleBack}
				size="icon"
				variant="outline"
			>
				<ArrowLeft className="h-4 w-4" />
				<span className="sr-only">Back</span>
			</Button>
			<h1 className="text-2xl font-bold">{title}</h1>
			<div className="w-10" /> {/* Spacer */}
		</div>
	);
}
