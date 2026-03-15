import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { CardDescription } from '@/components/ui/card';

interface StatsCardProps {
	accentColor?: string;
	children: React.ReactNode;
	className?: string;
	description?: React.ReactNode;
	title: React.ReactNode;
}

export default function StatsCard({
	accentColor,
	children,
	className,
	description,
	title,
}: StatsCardProps) {
	return (
		<Card
			className={className}
			data-testid="stats-card"
			style={
				accentColor
					? {
							borderBottomColor: `color-mix(in srgb, ${accentColor}, transparent 70%)`,
							borderLeftColor: accentColor,
							borderLeftWidth: '4px',
							borderRightColor: `color-mix(in srgb, ${accentColor}, transparent 70%)`,
							borderTopColor: `color-mix(in srgb, ${accentColor}, transparent 70%)`,
						}
					: undefined
			}
		>
			<CardHeader className="p-4 pb-2">
				<CardTitle className="text-base">
					{title}
				</CardTitle>
				{description && <CardDescription>{description}</CardDescription>}
			</CardHeader>
			<CardContent className="p-4 pt-0">{children}</CardContent>
		</Card>
	);
}
