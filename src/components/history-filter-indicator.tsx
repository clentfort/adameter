import { format, parseISO } from 'date-fns';
import { fbt } from 'fbtee';
import { X } from 'lucide-react';
import Link from 'next/link';

interface HistoryFilterIndicatorProps {
	baseUrl: string;
	eventTitle?: string | null;
	from: string;
	to: string;
}

export default function HistoryFilterIndicator({
	baseUrl,
	eventTitle,
	from,
	to,
}: HistoryFilterIndicatorProps) {
	const fromDate = parseISO(from);
	const toDate = parseISO(to);

	return (
		<div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
			<div className="flex-1">
				<p className="text-sm font-medium text-primary">
					{eventTitle ? (
						<fbt desc="Indicator showing which event the user is currently viewing related activity for">
							Viewing related activity for{' '}
							<fbt:param name="eventTitle">{eventTitle}</fbt:param>
						</fbt>
					) : (
						<fbt desc="Indicator showing that the history is currently filtered to a specific timeframe">
							Viewing filtered timeframe
						</fbt>
					)}
				</p>
				<p className="text-xs text-muted-foreground mt-0.5">
					<fbt desc="The date range of the current filter">
						<fbt:param name="fromDate">
							{format(fromDate, 'dd.MM.yyyy')}
						</fbt:param>
						{' - '}
						<fbt:param name="toDate">{format(toDate, 'dd.MM.yyyy')}</fbt:param>
					</fbt>
				</p>
			</div>
			<Link
				className="p-2 hover:bg-primary/10 rounded-full transition-colors text-primary"
				href={baseUrl}
				title={fbt('Clear filter', 'Tooltip for clearing the current filter')}
			>
				<X className="h-4 w-4" />
			</Link>
		</div>
	);
}
