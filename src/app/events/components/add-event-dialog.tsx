import type { Event } from '@/types/event';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

interface AddEventDialogProps {
	event?: Event;
	onClose?: () => void;
	// Optional for editing existing event
	onSave: (event: Event) => void;
}

export default function AddEventDialog({
	event,
	onClose,
	onSave,
}: AddEventDialogProps) {
	const [open, setOpen] = useState(!!event);
	const [title, setTitle] = useState(event?.title || '');
	const [description, setDescription] = useState(event?.description || '');
	const [startDate, setStartDate] = useState(
		event?.startDate
			? new Date(event.startDate).toISOString().split('T')[0]
			: new Date().toISOString().split('T')[0],
	);
	const [startTime, setStartTime] = useState(
		event?.startDate
			? new Date(event.startDate).toTimeString().slice(0, 5)
			: new Date().toTimeString().slice(0, 5),
	);
	const [eventType, setEventType] = useState<'point' | 'period'>(
		event?.type || 'point',
	);
	const [hasEndDate, setHasEndDate] = useState(!!event?.endDate);
	const [endDate, setEndDate] = useState(
		event?.endDate
			? new Date(event.endDate).toISOString().split('T')[0]
			: new Date().toISOString().split('T')[0],
	);
	const [endTime, setEndTime] = useState(
		event?.endDate
			? new Date(event.endDate).toTimeString().slice(0, 5)
			: new Date().toTimeString().slice(0, 5),
	);
	const [color, setColor] = useState(event?.color || '#6366f1'); // Default to indigo

	const handleSave = () => {
		if (!title || !startDate) return;

		const startDateTime = new Date(`${startDate}T${startTime}`);
		let endDateTime = hasEndDate
			? new Date(`${endDate}T${endTime}`)
			: undefined;

		// Ensure end date is after start date
		if (endDateTime && endDateTime <= startDateTime) {
			endDateTime = new Date(startDateTime.getTime() + 3_600_000); // Add 1 hour
		}

		const newEvent: Event = {
			color,
			description: description || undefined,
			endDate: endDateTime?.toISOString(),
			id: event?.id || Date.now().toString(),
			startDate: startDateTime.toISOString(),
			title,
			type: eventType,
		};

		onSave(newEvent);
		setOpen(false);
		if (onClose) onClose();
	};

	const handleOpenChange = (newOpen: boolean) => {
		setOpen(newOpen);
		if (!newOpen && onClose) onClose();
	};

	return (
		<Dialog onOpenChange={handleOpenChange} open={open}>
			{!event && (
				<DialogTrigger asChild>
					<Button onClick={() => setOpen(true)} size="sm" variant="outline">
						<PlusCircle className="h-4 w-4 mr-1" />
						<fbt desc="addEvent">Add Event</fbt>
					</Button>
				</DialogTrigger>
			)}
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>
						{event ? (
							<fbt desc="editEvent">Edit Event</fbt>
						) : (
							<fbt desc="newEvent">Add New Event</fbt>
						)}
					</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="title">
							<fbt desc="title">Title</fbt>
						</Label>
						<Input
							id="title"
							onChange={(e) => setTitle(e.target.value)}
							placeholder=<fbt desc="titleExample">
								e.g. Birth, Vaccination, Illness
							</fbt>
							value={title}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">
							<fbt desc="description">Description (optional)</fbt>
						</Label>
						<Textarea
							id="description"
							onChange={(e) => setDescription(e.target.value)}
							placeholder=<fbt desc="descriptionPlaceholder">
								Additional details about the event
							</fbt>
							rows={3}
							value={description}
						/>
					</div>

					<div className="space-y-2">
						<Label>
							<fbt desc="eventType">Event Type</fbt>
						</Label>
						<RadioGroup
							className="flex gap-4"
							onValueChange={(value) =>
								setEventType(value as 'point' | 'period')
							}
							value={eventType}
						>
							<div className="flex items-center space-x-2">
								<RadioGroupItem id="point" value="point" />
								<Label htmlFor="point">
									<fbt desc="pointEvent">Point in time (e.g. Vaccination)</fbt>
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem id="period" value="period" />
								<Label htmlFor="period">
									<fbt desc="periodEvent">Period (e.g. Illness)</fbt>
								</Label>
							</div>
						</RadioGroup>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="start-date">
								<fbt common>Date</fbt>
							</Label>
							<Input
								id="start-date"
								onChange={(e) => setStartDate(e.target.value)}
								type="date"
								value={startDate}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="start-time">
								<fbt common>Time</fbt>
							</Label>
							<Input
								id="start-time"
								onChange={(e) => setStartTime(e.target.value)}
								type="time"
								value={startTime}
							/>
						</div>
					</div>

					{eventType === 'period' && (
						<>
							<div className="flex items-center space-x-2">
								<Switch
									checked={hasEndDate}
									id="has-end-date"
									onCheckedChange={setHasEndDate}
								/>
								<Label htmlFor="has-end-date">
									<fbt desc="setEndDate">Set End Date</fbt>
								</Label>
							</div>

							{hasEndDate && (
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="end-date">
											<fbt desc="endDate">End Date</fbt>
										</Label>
										<Input
											id="end-date"
											onChange={(e) => setEndDate(e.target.value)}
											type="date"
											value={endDate}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="end-time">
											<fbt desc="endTime">End Time</fbt>
										</Label>
										<Input
											id="end-time"
											onChange={(e) => setEndTime(e.target.value)}
											type="time"
											value={endTime}
										/>
									</div>
								</div>
							)}
						</>
					)}

					<div className="space-y-2">
						<Label htmlFor="color">
							<fbt desc="color">Color</fbt>
						</Label>
						<div className="flex gap-2">
							{[
								'#6366f1',
								'#ec4899',
								'#10b981',
								'#f59e0b',
								'#ef4444',
								'#8b5cf6',
							].map((colorOption) => (
								<button
									aria-label={`Farbe ${colorOption}`}
									className={`w-8 h-8 rounded-full ${color === colorOption ? 'ring-2 ring-offset-2 ring-black' : ''}`}
									key={colorOption}
									onClick={() => setColor(colorOption)}
									style={{ backgroundColor: colorOption }}
									type="button"
								/>
							))}
						</div>
					</div>
				</div>
				<DialogFooter>
					<Button onClick={handleSave} type="submit">
						<fbt common>Save</fbt>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
