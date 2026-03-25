'use client';

import { PlusCircle } from 'lucide-react';
import React from 'react';
import HistoryRangeSelector from '@/components/history-range-selector';
import { Button } from '@/components/ui/button';

interface HistoryHeaderProps {
	from?: string | null;
	onAddEntry?: () => void;
	onRangeChange?: (from: string, to: string) => void;
	title: React.ReactNode;
	to?: string | null;
}

export default function HistoryHeader({
	from,
	onAddEntry,
	onRangeChange,
	title,
	to,
}: HistoryHeaderProps) {
	return (
		<div className="flex justify-between items-center mb-4">
			<h2 className="text-xl font-semibold">{title}</h2>
			<div className="flex items-center gap-2">
				{onRangeChange && (
					<HistoryRangeSelector
						from={from}
						onRangeChange={onRangeChange}
						to={to}
					/>
				)}
				{onAddEntry && (
					<Button onClick={onAddEntry} size="sm" variant="outline">
						<PlusCircle className="h-4 w-4 mr-1" />
						<fbt common>Add Entry</fbt>
					</Button>
				)}
			</div>
		</div>
	);
}
