import { z } from 'zod';
import { baseEntitySchema } from './base-entity';
import {
	locationFormFields,
	optionalNumberCell,
	optionalStringCell,
	parseLocationFormFields,
	requiredNameField,
} from './schema-utils';

const eventTypeSchema = z.enum(['point', 'period']);

const eventSharedSchema = z.object({
	color: optionalStringCell, // Optional color for the event
	endDate: optionalStringCell, // ISO string, optional for ongoing events
	locationLatitude: optionalNumberCell,
	locationLongitude: optionalNumberCell,
	notes: optionalStringCell,
	startDate: z.string().min(1), // ISO string
	title: requiredNameField,
	type: eventTypeSchema, // point = single date, period = start to end date
});

export const eventFormSchema = z.object({
	color: requiredNameField,
	endDate: z.string(),
	endTime: z.string(),
	hasEndDate: z.boolean(),
	...locationFormFields,
	notes: z.string(),
	startDate: z.string().min(1),
	startTime: z.string().min(1),
	title: requiredNameField,
	type: eventTypeSchema,
});

export type EventFormValues = z.infer<typeof eventFormSchema>;

export const eventFormToDataSchema = eventFormSchema.transform((values) => {
	const startDateTime = new Date(`${values.startDate}T${values.startTime}`);
	let endDateTime = values.hasEndDate
		? new Date(`${values.endDate}T${values.endTime}`)
		: undefined;

	if (endDateTime && endDateTime <= startDateTime) {
		endDateTime = new Date(startDateTime.getTime() + 3_600_000);
	}

	return eventSharedSchema.parse({
		color: values.color,
		endDate: endDateTime?.toISOString(),
		...parseLocationFormFields(values),
		notes: values.notes,
		startDate: startDateTime.toISOString(),
		title: values.title,
		type: values.type,
	});
});

export const eventDataSchema = eventSharedSchema;

export const eventSchema = baseEntitySchema.extend(eventDataSchema.shape);

export type EventData = z.infer<typeof eventDataSchema>;
export type EventFormData = z.infer<typeof eventFormToDataSchema>;

export function parseEventFormValues(values: EventFormValues): EventFormData {
	return eventFormToDataSchema.parse(values);
}

export type Event = z.infer<typeof eventSchema>;
