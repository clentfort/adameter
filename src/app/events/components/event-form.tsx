import type { ReactNode } from 'react';
import type { Event, EventFormData, EventFormValues } from '@/types/event';
import { fbt } from 'fbtee';
import { useMemo } from 'react';
import { DateTimeInputs } from '@/components/form/date-time-inputs';
import { EntityFormDialog } from '@/components/form/entity-form-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useEntityForm } from '@/hooks/use-entity-form';
import { eventFormToDataSchema } from '@/types/event';
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

type EventFromProps = AddEventFormProps | EditEventFormProps;

const COLORS = [
	'#6366f1',
	'#ec4899',
	'#10b981',
	'#f59e0b',
	'#ef4444',
	'#8b5cf6',
];

function getDefaultValues(event: Event | undefined): EventFormValues {
	return {
		color: event?.color ?? COLORS[0],
		endDate: dateToDateInputValue(event?.endDate ?? new Date()),
		endTime: dateToTimeInputValue(event?.endDate ?? new Date()),
		hasEndDate: !!event?.endDate,
		notes: event?.notes ?? '',
		startDate: dateToDateInputValue(event?.startDate ?? new Date()),
		startTime: dateToTimeInputValue(event?.startDate ?? new Date()),
		title: event?.title ?? '',
		type: event?.type ?? 'point',
	};
}

export default function EventForm({
	onClose,
	onSave,
	title: dialogTitle,
	...props
}: EventFromProps) {
	const event = 'event' in props ? props.event : undefined;

	const defaultValues = useMemo(() => getDefaultValues(event), [event]);

	const form = useEntityForm<EventFormValues, undefined, EventFormData>(
		eventFormToDataSchema,
		defaultValues,
	);

	const { register, setValue, watch } = form;

	const eventType = watch('type');
	const hasEndDate = watch('hasEndDate');
	const color = watch('color');

	const handleSave = (parsedValues: EventFormData) => {
		const newEvent: Event = {
			...event,
			color: parsedValues.color,
			endDate: parsedValues.endDate,
			id: event?.id || Date.now().toString(),
			notes: parsedValues.notes,
			startDate: parsedValues.startDate,
			title: parsedValues.title,
			type: parsedValues.type,
		};

		onSave(newEvent);
		onClose();
	};

	return (
		<EntityFormDialog
			form={form}
			onClose={onClose}
			onSave={handleSave}
			title={dialogTitle}
		>
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
					<Label htmlFor="notes">
						<fbt desc="Label for an optional event description input">
							Description (optional)
						</fbt>
					</Label>
					<Textarea
						id="notes"
						placeholder={fbt(
							'Additional details about the event',
							'Placeholder for event description input',
						)}
						rows={3}
						{...register('notes')}
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
						onValueChange={(value) => {
							setValue('type', value as 'point' | 'period', {
								shouldValidate: true,
							});
						}}
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

				<DateTimeInputs
					dateField="startDate"
					dateId="start-date"
					register={register}
					timeField="startTime"
					timeId="start-time"
				/>

				{eventType === 'period' && (
					<>
						<div className="flex items-center space-x-2">
							<Switch
								checked={hasEndDate}
								data-testid="has-end-date-switch"
								id="has-end-date"
								onCheckedChange={(checked) => {
									setValue('hasEndDate', checked, {
										shouldValidate: true,
									});
								}}
							/>
							<Label htmlFor="has-end-date">
								<fbt desc="Label for a switch that enables or disable the fields to set an end date for an event">
									Set End Date
								</fbt>
							</Label>
						</div>

						{hasEndDate && (
							<DateTimeInputs
								dateField="endDate"
								dateId="end-date"
								dateLabel={
									<fbt desc="Label for an input to set the end date of an event">
										End Date
									</fbt>
								}
								register={register}
								timeField="endTime"
								timeId="end-time"
								timeLabel={
									<fbt desc="Label for an input to set the end time of an event">
										End Time
									</fbt>
								}
							/>
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
								className={`w-8 h-8 rounded-full ${
									color === colorOption ? 'ring-2 ring-offset-2 ring-black' : ''
								}`}
								key={colorOption}
								onClick={() => {
									setValue('color', colorOption, { shouldValidate: true });
								}}
								style={{ backgroundColor: colorOption }}
								type="button"
							/>
						))}
					</div>
				</div>
			</div>
		</EntityFormDialog>
	);
}
