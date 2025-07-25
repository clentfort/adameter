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
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';
import { dateToTimeInputValue } from '@/utils/date-to-time-input-value';

interface BottleFeedingFormProps {
	feeding?: FeedingSession;
	onClose: () => void;
	onSave: (session: FeedingSession) => void;
	title: ReactNode;
}

export default function BottleFeedingForm({
	feeding,
	onClose,
	onSave,
	title,
}: BottleFeedingFormProps) {
	const [date, setDate] = useState(
		dateToDateInputValue(feeding?.startTime ?? new Date()),
	);
	const [time, setTime] = useState(
		dateToTimeInputValue(feeding?.startTime ?? new Date()),
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

		setAmount(feeding.amountInMl ? feeding.amountInMl.toString() : '');
	}, [feeding]);

	const handleSubmit = () => {
		if (!date || !time || !amount || Number.isNaN(Number(amount))) {
			return;
		}

		const amountInMl = Number(amount);
		const [year, month, day] = date.split('-').map(Number);
		const [hours, minutes] = time.split(':').map(Number);

		const startTime = new Date(year, month - 1, day, hours, minutes);
		const endTime = new Date(startTime.getTime());

		const updatedSession: FeedingSession = {
			...feeding,
			amountInMl,
			breast: 'bottle',
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
