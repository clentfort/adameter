'use client';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { FeedingSession } from '@/types/feeding';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';

interface AddHistoricSessionProps {
	onSessionAdd: (session: FeedingSession) => void;
}

export default function AddHistoricSession({
	onSessionAdd,
}: AddHistoricSessionProps) {
	const [open, setOpen] = useState(false);
	const [breast, setBreast] = useState<'left' | 'right'>('left');
	const [date, setDate] = useState('');
	const [time, setTime] = useState('');
	const [duration, setDuration] = useState('');

	// Set default values for today's date and current time
	const setDefaultValues = () => {
		const now = new Date();
		const formattedDate = now.toISOString().split('T')[0];
		const formattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

		setDate(formattedDate);
		setTime(formattedTime);
		setDuration('');
		setBreast('left');
	};

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

		const session: FeedingSession = {
			breast,
			durationInSeconds: durationInMinutes * 60,
			endTime: endTime.toISOString(),
			id: Date.now().toString(),
			startTime: startTime.toISOString(),
		};

		onSessionAdd(session);
		setOpen(false);
	};

	return (
		<Dialog
			onOpenChange={(newOpen) => {
				setOpen(newOpen);
				if (newOpen) {
					setDefaultValues();
				}
			}}
			open={open}
		>
			<DialogTrigger asChild>
				<Button size="sm" variant="outline">
					<PlusCircle className="h-4 w-4 mr-1" />
					<fbt desc="Button to add manually add a feeding session">
						Add Entry
					</fbt>
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>
						<fbt desc="Title of the dialog to manually add a feeding session">
							Add Historic Feeding
						</fbt>
					</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="space-y-2">
						<Label>
							<fbt desc="Label for the breast selection">Breast</fbt>
						</Label>
						<RadioGroup
							className="flex gap-4"
							onValueChange={(value) => setBreast(value as 'left' | 'right')}
							value={breast}
						>
							<div className="flex items-center space-x-2">
								<RadioGroupItem
									className="text-left-breast border-left-breast"
									id="left"
									value="left"
								/>
								<Label className="text-left-breast-dark" htmlFor="left">
									<fbt desc="Label for the left breast">Left Breast</fbt>
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem
									className="text-right-breast border-right-breast"
									id="right"
									value="right"
								/>
								<Label className="text-right-breast-dark" htmlFor="right">
									<fbt desc="Label for the right breast">Right Breast</fbt>
								</Label>
							</div>
						</RadioGroup>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="date">
								<fbt desc="Label for the date input">Date</fbt>
							</Label>
							<Input
								id="date"
								onChange={(e) => setDate(e.target.value)}
								type="date"
								value={date}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="time">
								<fbt desc="Label for the start time input">Start Time</fbt>
							</Label>
							<Input
								id="time"
								onChange={(e) => setTime(e.target.value)}
								type="time"
								value={time}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="duration">
							<fbt desc="Label for the duration input in minutes">Minutes</fbt>
						</Label>
						<Input
							id="duration"
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
