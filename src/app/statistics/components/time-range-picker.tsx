import type { CSSProperties, Dispatch, JSX, SetStateAction } from 'react';
import type { DateRange, TimeRange } from '@/utils/get-range-dates';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

interface CustomRange {
	from: string;
	to: string;
}

interface TimeRangePickerProps {
	customRange: CustomRange;
	onCustomRangeChange: Dispatch<SetStateAction<CustomRange>>;
	onTimeRangeChange: (value: TimeRange) => void;
	secondaryRange?: DateRange;
	timeRange: TimeRange;
}

export default function TimeRangePicker({
	customRange,
	onCustomRangeChange,
	onTimeRangeChange,
	secondaryRange,
	timeRange,
}: TimeRangePickerProps): JSX.Element {
	return (
		<div
			className="flex flex-col gap-4 mb-6 sticky z-30 bg-background -mx-4 px-4 py-3 border-b shadow-sm transition-all"
			style={
				{
					top: `calc(var(--header-height-expanded) - (var(--header-height-expanded) - var(--header-height-sticky)) * var(--header-scroll-progress))`,
				} as CSSProperties
			}
		>
			<div className="flex justify-between items-start">
				<h2 className="text-xl font-semibold pt-1">
					<fbt desc="Title for the statistics page">Statistics</fbt>
				</h2>
				<div className="flex flex-col items-end gap-1">
					<Select
						onValueChange={(value) => {
							if (value) {
								onTimeRangeChange(value as TimeRange);
							}
						}}
						value={timeRange}
					>
						<SelectTrigger className="w-[140px]">
							<SelectValue
								placeholder={
									<fbt desc="Placeholder text for the time range select input on the statistics page">
										Time Range
									</fbt>
								}
							/>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="7">
								<fbt desc="Option to display data for the last 7 days in statistics">
									Last 7 Days
								</fbt>
							</SelectItem>
							<SelectItem value="14">
								<fbt desc="Option to display data for the last 14 days in statistics">
									Last 14 Days
								</fbt>
							</SelectItem>
							<SelectItem value="30">
								<fbt desc="Option to display data for the last 30 days in statistics">
									Last 30 Days
								</fbt>
							</SelectItem>
							<SelectItem value="custom">
								<fbt desc="Option to display a custom time range in statistics">
									Custom Range
								</fbt>
							</SelectItem>
							<SelectItem value="all">
								<fbt desc="Option to display all data in statistics">
									All Data
								</fbt>
							</SelectItem>
						</SelectContent>
					</Select>
					{secondaryRange && (
						<div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
							<fbt desc="Label for the comparison date range in statistics">
								Comparing to:{' '}
								<fbt:param name="from">
									{format(secondaryRange.from, 'MMM d')}
								</fbt:param>{' '}
								-{' '}
								<fbt:param name="to">
									{format(secondaryRange.to, 'MMM d')}
								</fbt:param>
							</fbt>
						</div>
					)}
				</div>
			</div>

			{timeRange === 'custom' && (
				<div className="flex items-center gap-4 justify-end">
					<div className="flex items-center gap-2">
						<Label className="text-xs text-muted-foreground" htmlFor="from">
							<fbt desc="Label for the start date of a custom time range">
								From
							</fbt>
						</Label>
						<Input
							className="w-[140px]"
							id="from"
							onChange={(e) =>
								onCustomRangeChange((prev) => ({
									...prev,
									from: e.target.value,
								}))
							}
							type="date"
							value={customRange.from}
						/>
					</div>
					<div className="flex items-center gap-2">
						<Label className="text-xs text-muted-foreground" htmlFor="to">
							<fbt desc="Label for the end date of a custom time range">To</fbt>
						</Label>
						<Input
							className="w-[140px]"
							id="to"
							onChange={(e) =>
								onCustomRangeChange((prev) => ({
									...prev,
									to: e.target.value,
								}))
							}
							type="date"
							value={customRange.to}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
