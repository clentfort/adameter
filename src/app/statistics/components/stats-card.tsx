import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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

interface StatHeadlineProps {
	comparison?: React.ReactNode;
	value: React.ReactNode;
}

export function StatHeadline({ comparison, value }: StatHeadlineProps) {
	return (
		<div className="flex items-baseline">
			<div className="text-2xl font-bold">{value}</div>
			{comparison}
		</div>
	);
}

interface StatInlineRowProps {
	className?: string;
	label: React.ReactNode;
	value: React.ReactNode;
}

export function StatInlineRow({ className, label, value }: StatInlineRowProps) {
	return (
		<div
			className={cn(
				'flex flex-wrap items-baseline gap-x-2 text-xs text-muted-foreground',
				className,
			)}
		>
			{label}
			{value}
		</div>
	);
}

interface StatBreakdownRowProps {
	className?: string;
	label: React.ReactNode;
	value: React.ReactNode;
}

export function StatBreakdownRow({
	className,
	label,
	value,
}: StatBreakdownRowProps) {
	return (
		<div className={cn('text-xs text-muted-foreground', className)}>
			{label}: {value}
		</div>
	);
}
