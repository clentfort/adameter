'use client';

import type { DiaperChange } from '@/types/diaper';
import { fbt } from 'fbtee';
import { useMemo, useState } from 'react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import YearlyActivityHeatMap from './yearly-activity-heat-map';

interface DiaperYearlyActivityProps {
	diaperChanges: DiaperChange[];
}

type ActivityFilter = 'all' | 'diaper' | 'potty';

export default function DiaperYearlyActivity({
	diaperChanges,
}: DiaperYearlyActivityProps) {
	const [filter, setFilter] = useState<ActivityFilter>('all');

	const filteredDates = useMemo(() => {
		return diaperChanges
			.filter((change) => {
				if (filter === 'all') return true;
				if (filter === 'diaper')
					return change.containsUrine || change.containsStool;
				if (filter === 'potty') return change.pottyUrine || change.pottyStool;
				return true;
			})
			.map((change) => change.timestamp);
	}, [diaperChanges, filter]);

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<Select
					onValueChange={(value) => setFilter(value as ActivityFilter)}
					value={filter}
				>
					<SelectTrigger className="w-[180px] h-8 text-xs">
						<SelectValue
							placeholder={fbt(
								'Filter activity',
								'Placeholder for activity filter',
							)}
						/>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">
							<fbt desc="Option for all activity (diaper + potty)">
								All Activity
							</fbt>
						</SelectItem>
						<SelectItem value="diaper">
							<fbt desc="Option for diaper only activity">Diaper Only</fbt>
						</SelectItem>
						<SelectItem value="potty">
							<fbt desc="Option for potty only activity">Potty Only</fbt>
						</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<YearlyActivityHeatMap
				dates={filteredDates}
				noCard={true}
				palette="diaper"
			/>
		</div>
	);
}
