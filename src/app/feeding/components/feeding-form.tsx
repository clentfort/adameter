import type { FeedingSession } from '@/types/feeding';
import { ReactNode, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';
import { dateToTimeInputValue } from '@/utils/date-to-time-input-value';

interface FeedingFormProps {
	feeding?: FeedingSession;
	onClose: () => void;
	onSave: (session: FeedingSession) => void;
	title: ReactNode;
}

export default function FeedingForm({
	feeding,
	onClose,
	onSave,
	title,
}: FeedingFormProps) {
	const [breast, setBreast] = useState<'left' | 'right'>(
		feeding?.breast ?? 'left',
	);
	const [date, setDate] = useState(
		dateToDateInputValue(feeding?.startTime ?? new Date()),
	);
	const [time, setTime] = useState(
		dateToTimeInputValue(feeding?.startTime ?? new Date()),
	);
	const [duration, setDuration] = useState(
		feeding?.durationInSeconds
			? Math.round(feeding.durationInSeconds / 60).toString()
			: '',
	);

	useEffect(() => {
		if (!feeding) {
			return;
		}

		const startDate = new Date(feeding.startTime);

		setDate(dateToDateInputValue(startDate));
		setTime(dateToTimeInputValue(startDate));

		const durationInMinutes = Math.round(feeding.durationInSeconds / 60);
		setDuration(durationInMinutes.toString());
	}, [feeding]);

	const handleSubmit = () => {
		if (!date || !time || !duration || Number.isNaN(Number(duration))) {
			return;
		}

		const durationInMinutes = Number(duration);
		const [year, month, day] = date.split('-').map(Number);
		const [hours, minutes] = time.split(':').map(Number);

		const startTime = new Date(year, month - 1, day, hours, minutes);
		const endTime = new Date(
			startTime.getTime() + durationInMinutes * 60 * 1000,
		);

		const updatedSession: FeedingSession = {
			...feeding,
			breast,
			durationInSeconds: durationInMinutes * 60,
			endTime: endTime.toISOString(),
			id: feeding?.id ?? Date.now().toString(),
			startTime: startTime.toISOString(),
		};

		onSave(updatedSession);
		onClose();
	};

	return (
		<Dialog onOpenChange={(open) => !open && onClose()} open={true}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="space-y-2">
						<Label>
							<fbt desc="Label for a radio group that allows the user to select which breat was used to feed">
								Breast
							</fbt>
						</Label>
						<RadioGroup
							className="flex gap-4"
							onValueChange={(value) => setBreast(value as 'left' | 'right')}
							value={breast}
						>
							<div className="flex items-center space-x-2">
								<RadioGroupItem
									className="text-left-breast border-left-breast"
									id="edit-left"
									value="left"
								/>
								<Label className="text-left-breast-dark" htmlFor="edit-left">
									<fbt desc="Label for a radio button that indicates the left breast was used to feed">
										Left Breast
									</fbt>
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem
									className="text-right-breast border-right-breast"
									id="edit-right"
									value="right"
								/>
								<Label className="text-right-breast-dark" htmlFor="edit-right">
									<fbt desc="Label for a radio button that indicates the right breast was used to feed">
										Right Breast
									</fbt>
								</Label>
							</div>
						</RadioGroup>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="edit-date">
								<fbt desc="Label for a date input">Date</fbt>
							</Label>
							<Input
								id="edit-date"
								onChange={(e) => setDate(e.target.value)}
								type="date"
								value={date}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit-time">
								<fbt desc="Label for a time input that sets the starting time of a feeding session">
									Start Time
								</fbt>
							</Label>
							<Input
								id="edit-time"
								onChange={(e) => setTime(e.target.value)}
								type="time"
								value={time}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="edit-duration">
							<fbt desc="Label for a number input that sets the duration of a feeding session in minutes">
								minutes
							</fbt>
						</Label>
						<Input
							id="edit-duration"
							min="1"
							onChange={(e) => setDuration(e.target.value)}
							type="number"
							value={duration}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button
						className={
							breast === 'left'
								? 'bg-left-breast hover:bg-left-breast-dark'
								: 'bg-right-breast hover:bg-right-breast-dark'
						}
						onClick={handleSubmit}
						type="submit"
					>
						<fbt common>Save</fbt>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
