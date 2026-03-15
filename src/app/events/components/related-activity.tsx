'use client';

import type { DiaperChange } from '@/types/diaper';
import type { Event } from '@/types/event';
import type { FeedingSession } from '@/types/feeding';
import { isWithinInterval, parseISO } from 'date-fns';
import { fbt } from 'fbtee';
import { useMemo } from 'react';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { formatDurationAbbreviated } from '@/utils/format-duration-abbreviated';
import { formatEntryTime } from '@/utils/format-history-date';
import { isAbnormalTemperature } from '@/app/diaper/utils/is-abnormal-temperature';

interface RelatedActivityProps {
	event: Event;
}

type ActivityItem =
	| { data: DiaperChange; timestamp: Date; type: 'diaper' }
	| { data: FeedingSession; timestamp: Date; type: 'feeding' };

export default function RelatedActivity({
	diaperChanges,
	event,
	feedingSessions,
}: RelatedActivityProps & {
	diaperChanges: DiaperChange[];
	feedingSessions: FeedingSession[];
}) {
	const relatedItems = useMemo(() => {
		if (event.type !== 'period') {
			return [];
		}

		const start = parseISO(event.startDate);
		const interval = {
			end: event.endDate ? parseISO(event.endDate) : new Date(),
			start,
		};

		const filteredDiapers: ActivityItem[] = diaperChanges
			.filter((change) =>
				isWithinInterval(parseISO(change.timestamp), interval),
			)
			.map((change) => ({
				data: change,
				timestamp: parseISO(change.timestamp),
				type: 'diaper',
			}));

		const filteredFeedings: ActivityItem[] = feedingSessions
			.filter((session) =>
				isWithinInterval(parseISO(session.startTime), interval),
			)
			.map((session) => ({
				data: session,
				timestamp: parseISO(session.startTime),
				type: 'feeding',
			}));

		return [...filteredDiapers, ...filteredFeedings].sort(
			(a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
		);
	}, [event, diaperChanges, feedingSessions]);

	if (event.type !== 'period' || relatedItems.length === 0) {
		return null;
	}

	return (
		<div className="mt-4 border-t pt-2">
			<Accordion>
				<AccordionItem className="border-none" value="related-activity">
					<AccordionTrigger className="py-2 text-sm font-semibold hover:no-underline">
						<fbt desc="Label for related activity section in event list">
							Related Activity (<fbt:param name="count">
								{relatedItems.length}
							</fbt:param>)
						</fbt>
					</AccordionTrigger>
					<AccordionContent>
						<div className="max-h-60 overflow-y-auto px-1">
							<div className="space-y-3 pt-2 pr-2">
								{relatedItems.map((item) => (
									<div
										className={cn(
											'text-sm border-l-2 pl-3 py-1 flex flex-col gap-1',
											item.type === 'feeding'
												? item.data.breast === 'left'
													? 'border-left-breast'
													: 'border-right-breast'
												: item.data.containsStool || item.data.pottyStool
													? 'border-amber-700'
													: 'border-yellow-400',
										)}
										key={item.data.id}
									>
										<div className="flex items-center justify-between text-xs text-muted-foreground">
											<div className="flex items-center gap-2">
												<span className="font-medium">
													{formatEntryTime(item.timestamp.toISOString())}
												</span>
												<span>•</span>
												<span>
													{item.type === 'feeding' ? (
														<fbt desc="Activity type feeding">Feeding</fbt>
													) : (
														<fbt desc="Activity type diaper">Diaper</fbt>
													)}
												</span>
											</div>
											{item.type === 'diaper' && item.data.temperature && (
												<div
													className={cn(
														'flex items-center gap-0.5',
														isAbnormalTemperature(item.data.temperature) &&
															'text-red-600 font-semibold',
													)}
												>
													<span>🌡️</span>
													<span>{item.data.temperature} °C</span>
												</div>
											)}
										</div>

										<div className="font-medium">
											{item.type === 'feeding' ? (
												<div className="flex items-center gap-2">
													<span>
														{item.data.breast === 'left' ? (
															<fbt desc="Left breast label">Left Breast</fbt>
														) : (
															<fbt desc="Right breast label">Right Breast</fbt>
														)}
													</span>
													<span className="text-muted-foreground font-normal">
														({formatDurationAbbreviated(
															item.data.durationInSeconds,
														)})
													</span>
												</div>
											) : (
												<div className="flex flex-wrap gap-x-2">
													{(item.data.containsUrine ||
														item.data.containsStool) && (
														<span className="flex items-center gap-1">
															<span>👶</span>
															{item.data.containsUrine &&
															item.data.containsStool ? (
																<fbt desc="Label indicating diaper contains both urine and stool">
																	Urine & Stool
																</fbt>
															) : item.data.containsUrine ? (
																<fbt desc="Label indicating diaper contains urine">
																	Urine
																</fbt>
															) : (
																<fbt desc="Label indicating diaper contains stool">
																	Stool
																</fbt>
															)}
														</span>
													)}
													{(item.data.pottyUrine || item.data.pottyStool) && (
														<span className="flex items-center gap-1 text-blue-600">
															<span>🚽</span>
															{item.data.pottyUrine && item.data.pottyStool ? (
																<fbt desc="Urine & Stool in potty">
																	Urine & Stool
																</fbt>
															) : item.data.pottyUrine ? (
																<fbt desc="Urine in potty">Urine</fbt>
															) : (
																<fbt desc="Stool in potty">Stool</fbt>
															)}
														</span>
													)}
													{!item.data.containsUrine &&
														!item.data.containsStool &&
														!item.data.pottyUrine &&
														!item.data.pottyStool && (
															<span className="italic text-muted-foreground font-normal">
																<fbt desc="Dry diaper">Dry</fbt>
															</span>
														)}
												</div>
											)}
										</div>

										{item.data.notes && (
											<p className="text-xs text-muted-foreground italic whitespace-pre-wrap">
												{item.data.notes}
											</p>
										)}
									</div>
								))}
							</div>
						</div>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	);
}
