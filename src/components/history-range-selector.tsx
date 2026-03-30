'use client';

import { parseISO } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';
import { Button, buttonVariants } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

interface HistoryRangeSelectorProps {
	from?: string | null;
	onRangeChange: (from: string, to: string) => void;
	to?: string | null;
}

export default function HistoryRangeSelector({
	from,
	onRangeChange,
	to,
}: HistoryRangeSelectorProps) {
	const [open, setOpen] = useState(false);
	const [customRange, setCustomRange] = useState({
		from: dateToDateInputValue(from ? parseISO(from) : new Date()),
		to: dateToDateInputValue(to ? parseISO(to) : new Date()),
	});

	useEffect(() => {
		if (from && to) {
			setCustomRange({
				from: dateToDateInputValue(parseISO(from)),
				to: dateToDateInputValue(parseISO(to)),
			});
		}
	}, [from, to]);

	return (
		<Popover onOpenChange={setOpen} open={open}>
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
					<div className="grid gap-4">
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
					</div>
					<Button
						onClick={() => {
							onRangeChange(
								new Date(customRange.from).toISOString(),
								new Date(customRange.to).toISOString(),
							);
							setOpen(false);
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
