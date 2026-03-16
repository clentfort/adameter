'use client';

import type { TimeRange } from '@/utils/get-range-dates';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';
import { Button, buttonVariants } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select';

interface HistoryRangeSelectorProps {
	onRangeChange: (from: string, to: string) => void;
}

export default function HistoryRangeSelector({
	onRangeChange,
}: HistoryRangeSelectorProps) {
	const [timeRange, setTimeRange] = useState<TimeRange>('7');
	const [customRange, setCustomRange] = useState({
		from: dateToDateInputValue(new Date()),
		to: dateToDateInputValue(new Date()),
	});

	return (
		<Popover>
			<PopoverTrigger
				className={cn(
					buttonVariants({ size: 'sm', variant: 'outline' }),
					'cursor-pointer',
				)}
			>
				<CalendarIcon className="h-4 w-4 mr-2" />
				<fbt desc="Button to open timeframe selector">Select Timeframe</fbt>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-80">
				<div className="grid gap-4">
					<div className="space-y-2">
						<h4 className="font-medium leading-none">
							<fbt desc="Title for timeframe selector popup">Timeframe</fbt>
						</h4>
						<p className="text-sm text-muted-foreground">
							<fbt desc="Description for timeframe selector popup">
								Select a range to filter history.
							</fbt>
						</p>
					</div>
					<div className="grid gap-2">
						<div className="grid grid-cols-3 items-center gap-4">
							<Label htmlFor="range">
								<fbt desc="Label for range preset select">Preset</fbt>
							</Label>
							<Select
								onValueChange={(v) => setTimeRange(v as TimeRange)}
								value={timeRange}
							>
								<SelectTrigger className="col-span-2 h-8">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="7">
										<fbt desc="7 days preset">Last 7 Days</fbt>
									</SelectItem>
									<SelectItem value="14">
										<fbt desc="14 days preset">Last 14 Days</fbt>
									</SelectItem>
									<SelectItem value="30">
										<fbt desc="30 days preset">Last 30 Days</fbt>
									</SelectItem>
									<SelectItem value="custom">
										<fbt desc="Custom range preset">Custom Range</fbt>
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						{timeRange === 'custom' && (
							<>
								<div className="grid grid-cols-3 items-center gap-4">
									<Label htmlFor="from">
										<fbt desc="Label for from date">From</fbt>
									</Label>
									<Input
										className="col-span-2 h-8"
										id="from"
										onChange={(e) =>
											setCustomRange((r) => ({ ...r, from: e.target.value }))
										}
										type="date"
										value={customRange.from}
									/>
								</div>
								<div className="grid grid-cols-3 items-center gap-4">
									<Label htmlFor="to">
										<fbt desc="Label for to date">To</fbt>
									</Label>
									<Input
										className="col-span-2 h-8"
										id="to"
										onChange={(e) =>
											setCustomRange((r) => ({ ...r, to: e.target.value }))
										}
										type="date"
										value={customRange.to}
									/>
								</div>
							</>
						)}
					</div>
					<Button
						onClick={() => {
							if (timeRange === 'custom') {
								onRangeChange(
									new Date(customRange.from).toISOString(),
									new Date(customRange.to).toISOString(),
								);
							} else {
								// Handle presets
								const days = Number.parseInt(timeRange, 10);
								const to = new Date();
								const from = new Date();
								from.setDate(to.getDate() - (days - 1));
								onRangeChange(from.toISOString(), to.toISOString());
							}
						}}
						size="sm"
					>
						<fbt desc="Button to apply timeframe filter">Apply</fbt>
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
}
