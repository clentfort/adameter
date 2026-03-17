import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatsCardProps {
	children: React.ReactNode;
	className?: string;
	title: React.ReactNode;
}

export default function StatsCard({
	children,
	className,
	title,
}: StatsCardProps) {
	return (
		<Card className={className} data-testid="stats-card">
			<CardHeader className="p-4 pb-2">
				<CardTitle className="text-base">{title}</CardTitle>
			</CardHeader>
			<CardContent className="p-4 pt-0">{children}</CardContent>
		</Card>
	);
}
