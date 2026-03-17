import { format, isSameDay, parseISO } from 'date-fns';
import { fbt } from 'fbtee';
import { ArrowRight, Calendar } from 'lucide-react';
import Link from 'next/link';

interface HistoryFilterIndicatorProps {
	baseUrl: string;
	color?: string | null;
	eventTitle?: string | null;
	from: string;
	to: string;
}

export default function HistoryFilterIndicator({
	baseUrl,
	color,
	eventTitle,
	from,
	to,
}: HistoryFilterIndicatorProps) {
	const fromDate = parseISO(from);
	const toDate = parseISO(to);
	const isSingleDay = isSameDay(fromDate, toDate);

	return (
		<div
			className="bg-primary/5 border-l-4 rounded-lg p-3 mb-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2"
			style={{
				borderLeftColor: color || 'var(--color-primary)',
				borderLeftWidth: '4px',
			}}
		>
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
				<div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
					<Calendar className="h-3 w-3" />
					<span>
						{format(fromDate, 'dd.MM.yyyy')}
						{!isSingleDay && (
							<>
								<ArrowRight className="h-2 w-2 inline mx-1" />
								{format(toDate, 'dd.MM.yyyy')}
							</>
						)}
					</span>
				</div>
			</div>
			<Link
				className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-md transition-colors text-xs font-medium text-primary ml-4 shrink-0"
				href={baseUrl}
			>
				<fbt desc="Button label to clear the current history filter">
					Clear Filter
				</fbt>
			</Link>
		</div>
	);
}
