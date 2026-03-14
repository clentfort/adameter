import type { BaseEntity } from './base-entity';
import { z } from 'zod';
import { baseEntitySchema } from './base-entity';
import { optionalStringCell, requiredNameField } from './schema-utils';

const eventTypeSchema = z.enum(['point', 'period']);

const eventSharedSchema = z.object({
	color: optionalStringCell,
	endDate: optionalStringCell,
	notes: optionalStringCell,
	startDate: z.string().min(1),
	title: requiredNameField,
	type: eventTypeSchema,
});

export const eventFormSchema = z.object({
	color: requiredNameField,
	endDate: z.string(),
	endTime: z.string(),
	hasEndDate: z.boolean(),
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

export interface Event extends BaseEntity {
	// point = single date, period = start to end date
	color?: string;
	// ISO string
	endDate?: string;
	startDate: string;
	title: string;
	// ISO string, optional for ongoing events
	type: 'point' | 'period'; // Optional color for the event
}
