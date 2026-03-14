import type { BaseEntity } from './base-entity';
import { z } from 'zod';
import { baseEntitySchema } from './base-entity';
import { positiveNumericInputField } from './schema-utils';

const breastSchema = z.enum(['left', 'right']);

const feedingSessionSharedSchema = z.object({
	breast: breastSchema,
	durationInSeconds: z.number().int().positive(),
	endTime: z.string().min(1),
	startTime: z.string().min(1),
});

export const feedingFormSchema = z.object({
	breast: breastSchema,
	date: z.string().min(1),
	duration: positiveNumericInputField('Duration must be a positive number'),
	time: z.string().min(1),
});

export type FeedingFormValues = z.infer<typeof feedingFormSchema>;

export const feedingSessionFormToDataSchema = feedingFormSchema.transform(
	(values) => {
		const durationInMinutes = Number(values.duration);
		const [year, month, day] = values.date.split('-').map(Number);
		const [hours, minutes] = values.time.split(':').map(Number);

		const startTime = new Date(year, month - 1, day, hours, minutes);
		const endTime = new Date(
			startTime.getTime() + durationInMinutes * 60 * 1000,
		);

		return feedingSessionSharedSchema.parse({
			breast: values.breast,
			durationInSeconds: durationInMinutes * 60,
			endTime: endTime.toISOString(),
			startTime: startTime.toISOString(),
		});
	},
);

export const feedingSessionDataSchema = feedingSessionSharedSchema;

export const feedingSessionSchema = baseEntitySchema.extend(
	feedingSessionDataSchema.shape,
);

export type FeedingSessionData = z.infer<typeof feedingSessionDataSchema>;
export type FeedingSessionFormData = z.infer<
	typeof feedingSessionFormToDataSchema
>;

export function parseFeedingFormValues(
	values: FeedingFormValues,
): FeedingSessionFormData {
	return feedingSessionFormToDataSchema.parse(values);
}

export interface FeedingSession extends BaseEntity {
	breast: 'left' | 'right';
	durationInSeconds: number;
	endTime: string;
	startTime: string;
}
