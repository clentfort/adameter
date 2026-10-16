import type { JSX, ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function SettingsNavItem({
	href,
	icon,
	iconClassName,
	subtitle,
	testId,
	title,
}: {
	href: string;
	icon: ReactNode;
	iconClassName?: string;
	subtitle: ReactNode;
	testId: string;
	title: ReactNode;
}): JSX.Element {
	return (
		<Link
			className="w-full flex items-center justify-between p-4 bg-card rounded-xl border shadow-sm hover:bg-accent transition-colors"
			data-testid={testId}
			href={href}
		>
			<div className="flex items-center gap-3">
				{iconClassName ? (
					<div
						className={cn(
							'h-10 w-10 rounded-full flex items-center justify-center',
							iconClassName,
						)}
					>
						{icon}
					</div>
				) : (
					icon
				)}
				<div className="text-left">
					<p className="font-medium">{title}</p>
					<p className="text-sm text-muted-foreground">{subtitle}</p>
				</div>
			</div>
			<ChevronRight className="h-5 w-5 text-muted-foreground" />
		</Link>
	);
}
