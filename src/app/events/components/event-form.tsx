import type { Event } from '@/types/event';
import { eventSchema, type EventFormValues } from '@/types/event';
import { zodResolver } from '@hookform/resolvers/zod';
import { fbt } from 'fbtee';
import { ReactNode, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
	const event = 'event' in props ? props.event : undefined;

	const {
		formState: { isValid },
		handleSubmit,
		register,
		reset,
		setValue,
		watch,
	} = useForm<EventFormValues>({
		defaultValues: {
			color: event?.color ?? COLORS[0],
			description: event?.description ?? '',
			endDate: dateToDateInputValue(event?.endDate ?? new Date()),
			endTime: dateToTimeInputValue(event?.endDate ?? new Date()),
			hasEndDate: !!event?.endDate,
			startDate: dateToDateInputValue(event?.startDate ?? new Date()),
			startTime: dateToTimeInputValue(event?.startDate ?? new Date()),
			title: event?.title ?? '',
			type: event?.type ?? 'point',
		},
		mode: 'onChange',
		resolver: zodResolver(eventSchema),
	});

	const eventType = watch('type');
	const hasEndDate = watch('hasEndDate');
	const color = watch('color');

	useEffect(() => {
		if (event) {
			reset({
				color: event.color ?? COLORS[0],
				description: event.description ?? '',
				endDate: dateToDateInputValue(event.endDate ?? new Date()),
				endTime: dateToTimeInputValue(event.endDate ?? new Date()),
				hasEndDate: !!event.endDate,
				startDate: dateToDateInputValue(event.startDate),
				startTime: dateToTimeInputValue(event.startDate),
				title: event.title,
				type: event.type,
			});
		}
	}, [event, reset]);

	const onSubmit = (values: EventFormValues) => {
		const startDateTime = new Date(`${values.startDate}T${values.startTime}`);
		let endDateTime = values.hasEndDate
			? new Date(`${values.endDate}T${values.endTime}`)
			: undefined;

		// Ensure end date is after start date
		if (endDateTime && endDateTime <= startDateTime) {
			endDateTime = new Date(startDateTime.getTime() + 3_600_000); // Add 1 hour
		}

		const newEvent: Event = {
			...event,
			color: values.color,
			description: values.description || undefined,
			endDate: endDateTime?.toISOString(),
			id: event?.id || Date.now().toString(),
			startDate: startDateTime.toISOString(),
			title: values.title,
			type: values.type,
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
				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="grid gap-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="title">
								<fbt desc="Label for an input to set an events title">Title</fbt>
							</Label>
							<Input
								id="title"
								placeholder={fbt(
									'e.g. Birth, Vaccination, Illness',
									'Placeholder for event title input',
								)}
								{...register('title')}
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
								placeholder={fbt(
									'Additional details about the event',
									'Placeholder for event description input',
								)}
								rows={3}
								{...register('description')}
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
									setValue('type', value as 'point' | 'period', {
										shouldValidate: true,
									})
								}
								value={eventType}
							>
								<div className="flex items-center space-x-2">
									<RadioGroupItem
										data-testid="point-event-radio"
										id="point"
										value="point"
									/>
									<Label htmlFor="point">
										<fbt desc="Label for a radio input that sets the value to a point in time">
											Point in time (e.g. Vaccination)
										</fbt>
									</Label>
								</div>
								<div className="flex items-center space-x-2">
									<RadioGroupItem
										data-testid="period-event-radio"
										id="period"
										value="period"
									/>
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
								<Input id="start-date" type="date" {...register('startDate')} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="start-time">
									<fbt common>Time</fbt>
								</Label>
								<Input id="start-time" type="time" {...register('startTime')} />
							</div>
						</div>

						{eventType === 'period' && (
							<>
								<div className="flex items-center space-x-2">
									<Switch
										checked={hasEndDate}
										data-testid="has-end-date-switch"
										id="has-end-date"
										onCheckedChange={(checked) =>
											setValue('hasEndDate', checked, { shouldValidate: true })
										}
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
												type="date"
												{...register('endDate')}
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
												type="time"
												{...register('endTime')}
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
										onClick={() =>
											setValue('color', colorOption, { shouldValidate: true })
										}
										style={{ backgroundColor: colorOption }}
										type="button"
									/>
								))}
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button onClick={onClose} type="button" variant="outline">
							<fbt common>Cancel</fbt>
						</Button>
						<Button data-testid="save-button" type="submit">
							<fbt common>Save</fbt>
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
