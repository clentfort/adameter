'use client';

import type { DiaperChange } from '@/types/diaper';
import { useMemo, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import YearlyActivityHeatMap from './yearly-activity-heat-map';

interface DiaperYearlyActivityProps {
	diaperChanges: DiaperChange[];
}

export default function DiaperYearlyActivity({
	diaperChanges,
}: DiaperYearlyActivityProps) {
	const [showDiaper, setShowDiaper] = useState(true);
	const [showPotty, setShowPotty] = useState(true);

	const filteredDates = useMemo(() => {
		return diaperChanges
			.filter((change) => {
				const isDiaper = change.containsUrine || change.containsStool;
				const isPotty = change.pottyUrine || change.pottyStool;

				if (showDiaper && showPotty) return isDiaper || isPotty;
				if (showDiaper) return isDiaper;
				if (showPotty) return isPotty;
				return false;
			})
			.map((change) => change.timestamp);
	}, [diaperChanges, showDiaper, showPotty]);

	return (
		<div className="space-y-4">
			<div className="flex justify-end gap-4">
				<div className="flex items-center space-x-2">
					<Checkbox
						checked={showDiaper}
						id="filter-diaper"
						onCheckedChange={(checked) => setShowDiaper(!!checked)}
					/>
					<Label className="text-xs font-normal" htmlFor="filter-diaper">
						<fbt desc="Label for diaper activity checkbox">Diaper</fbt>
					</Label>
				</div>
				<div className="flex items-center space-x-2">
					<Checkbox
						checked={showPotty}
						id="filter-potty"
						onCheckedChange={(checked) => setShowPotty(!!checked)}
					/>
					<Label className="text-xs font-normal" htmlFor="filter-potty">
						<fbt desc="Label for potty activity checkbox">Potty</fbt>
					</Label>
				</div>
			</div>
			<YearlyActivityHeatMap
				dates={filteredDates}
				noCard={true}
				palette="diaper"
			/>
		</div>
	);
}
