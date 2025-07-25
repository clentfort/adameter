import type { FeedingSession, FeedingSource } from '@/types/feeding';
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
	const [source, setSource] = useState<FeedingSource>(
		feeding?.source ?? 'left',
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
	const [amount, setAmount] = useState(
		feeding?.amountInMl ? feeding.amountInMl.toString() : '',
	);

	useEffect(() => {
		if (!feeding) {
			return;
		}

		const startDate = new Date(feeding.startTime);

		setDate(dateToDateInputValue(startDate));
		setTime(dateToTimeInputValue(startDate));
		setSource(feeding.source);

		if (feeding.durationInSeconds) {
			const durationInMinutes = Math.round(feeding.durationInSeconds / 60);
			setDuration(durationInMinutes.toString());
		}
		if (feeding.amountInMl) {
			setAmount(feeding.amountInMl.toString());
		}
	}, [feeding]);

	const handleSubmit = () => {
		const isBreastFeeding = source === 'left' || source === 'right';
		if (
			!date ||
			!time ||
			(isBreastFeeding && !duration) ||
			(!isBreastFeeding && !amount)
		) {
			return;
		}

		const [year, month, day] = date.split('-').map(Number);
		const [hours, minutes] = time.split(':').map(Number);
		const startTime = new Date(year, month - 1, day, hours, minutes);

		let endTime = startTime;
		let durationInSeconds;
		let amountInMl;

		if (isBreastFeeding) {
			const durationInMinutes = Number(duration);
			durationInSeconds = durationInMinutes * 60;
			endTime = new Date(startTime.getTime() + durationInSeconds * 1000);
		} else {
			amountInMl = Number(amount);
		}

		const updatedSession: FeedingSession = {
			...feeding,
			source,
			durationInSeconds,
			amountInMl,
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
							<fbt desc="Label for a radio group that allows the user to select the source of the feeding">
								Source
							</fbt>
						</Label>
						<RadioGroup
							className="flex gap-4"
							onValueChange={(value) => setSource(value as FeedingSource)}
							value={source}
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
							<div className="flex items-center space-x-2">
								<RadioGroupItem id="edit-bottle" value="bottle" />
								<Label htmlFor="edit-bottle">
									<fbt desc="Label for a radio button that indicates a bottle was used to feed">
										Bottle
									</fbt>
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem id="edit-pump" value="pump" />
								<Label htmlFor="edit-pump">
									<fbt desc="Label for a radio button that indicates milk was pumped">
										Pump
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

					{(source === 'left' || source === 'right') && (
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
					)}

					{(source === 'bottle' || source === 'pump') && (
						<div className="space-y-2">
							<Label htmlFor="edit-amount">
								<fbt desc="Label for a number input that sets the amount of a feeding session in ml">
									ml
								</fbt>
							</Label>
							<Input
								id="edit-amount"
								min="1"
								onChange={(e) => setAmount(e.target.value)}
								type="number"
								value={amount}
							/>
						</div>
					)}
				</div>
				<DialogFooter>
					<Button onClick={handleSubmit} type="submit">
						<fbt common>Save</fbt>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
