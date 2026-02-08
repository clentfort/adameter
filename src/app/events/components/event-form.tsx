import type { Event } from '@/types/event';
import { fbt } from 'fbtee';
import { ReactNode, useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';
import { dateToTimeInputValue } from '@/utils/date-to-time-input-value';

interface AddEventFormProps {
	onClose: () => void;
	onSave: (event: Event) => void;
	title: ReactNode;
}

interface EditEventFormProps {
	event: Event;
	onClose: () => void;
	onSave: (event: Event) => void;
	title: ReactNode;
}

type EventFromProps = EditEventFormProps | AddEventFormProps;

const COLORS = [
	'#6366f1',
	'#ec4899',
	'#10b981',
	'#f59e0b',
	'#ef4444',
	'#8b5cf6',
];

export default function EventForm({
	onClose,
	onSave,
	title: dialogTitle,
	...props
}: EventFromProps) {
	const [eventTitle, setEventTitle] = useState(
		'event' in props ? props.event.title : '',
	);
	const [description, setDescription] = useState(
		'event' in props ? props.event.description : '',
	);
	const [startDate, setStartDate] = useState(
		dateToDateInputValue('event' in props ? props.event.startDate : new Date()),
	);
	const [startTime, setStartTime] = useState(
		dateToTimeInputValue('event' in props ? props.event.startDate : new Date()),
	);
	const [eventType, setEventType] = useState<'point' | 'period'>(
		'event' in props ? props.event.type : 'point',
	);
	const [hasEndDate, setHasEndDate] = useState(
		'event' in props ? !!props.event.endDate : false,
	);
	const [endDate, setEndDate] = useState(
		dateToDateInputValue(
			'event' in props && props.event.endDate
				? props.event.endDate
				: new Date(),
		),
	);
	const [endTime, setEndTime] = useState(
		dateToTimeInputValue(
			'event' in props && props.event.endDate
				? props.event.endDate
				: new Date(),
		),
	);
	const [color, setColor] = useState(
		'event' in props && props.event.color ? props.event.color : COLORS[0], // Default to indigo
	);

	const event = 'event' in props ? props.event : undefined;
	const handleSave = () => {
		if (!eventTitle || !startDate) return;

		const startDateTime = new Date(`${startDate}T${startTime}`);
		let endDateTime = hasEndDate
			? new Date(`${endDate}T${endTime}`)
			: undefined;

		// Ensure end date is after start date
		if (endDateTime && endDateTime <= startDateTime) {
			endDateTime = new Date(startDateTime.getTime() + 3_600_000); // Add 1 hour
		}

		const newEvent: Event = {
			...event,
			color,
			description: description || undefined,
			endDate: endDateTime?.toISOString(),
			id: event?.id || Date.now().toString(),
			startDate: startDateTime.toISOString(),
			title: eventTitle,
			type: eventType,
		};

		onSave(newEvent);
		onClose();
	};

	return (
		<Dialog onOpenChange={(open) => !open && onClose()} open={true}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>{dialogTitle}</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="title">
							<fbt desc="Label for an input to set an events title">Title</fbt>
						</Label>
						<Input
							id="title"
							onChange={(e) => setEventTitle(e.target.value)}
							placeholder={fbt(
								'e.g. Birth, Vaccination, Illness',
								'Placeholder for event title input',
							)}
							value={eventTitle}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">
							<fbt desc="Label for an optional event description input">
								Description (optional)
							</fbt>
						</Label>
						<Textarea
							id="description"
							onChange={(e) => setDescription(e.target.value)}
							placeholder={fbt(
								'Additional details about the event',
								'Placeholder for event description input',
							)}
							rows={3}
							value={description}
						/>
					</div>

					<div className="space-y-2">
						<Label>
							<fbt desc="Label for a radio input to set the events type (point or period)">
								Event Type
							</fbt>
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
									<fbt desc="Label for a radio input that sets the value to a point in time">
										Point in time (e.g. Vaccination)
									</fbt>
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem id="period" value="period" />
								<Label htmlFor="period">
									<fbt desc="Label for a radio input that sets the value to a timne period">
										Period (e.g. Illness)
									</fbt>
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
									<fbt desc="Label for a switch that enables or disable the fields to set an end date for an event">
										Set End Date
									</fbt>
								</Label>
							</div>

							{hasEndDate && (
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="end-date">
											<fbt desc="Label for an input to set the end date of an event">
												End Date
											</fbt>
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
											<fbt desc="Label for an input to set the end time of an event">
												End Time
											</fbt>
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
							<fbt desc="Label for color swatch picker">Color</fbt>
						</Label>
						<div className="flex gap-2">
							{COLORS.map((colorOption) => (
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
