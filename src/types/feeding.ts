import type { BaseEntity } from './base-entity';
import { z } from 'zod';
import { baseEntitySchema } from './base-entity';
import {
	numericInputField,
	optionalNumberFromInputField,
	optionalPositiveNumberCell,
	optionalStringCell,
	positiveNumericInputField,
} from './schema-utils';

export const feedingTypeSchema = z.enum(['breast', 'bottle', 'pumping']);
export type FeedingType = z.infer<typeof feedingTypeSchema>;

export const milkTypeSchema = z.enum(['pumped', 'formula']);
export type MilkType = z.infer<typeof milkTypeSchema>;

const breastSchema = z.enum(['left', 'right']);

const feedingSessionSharedSchema = z.object({
	amountMl: optionalPositiveNumberCell,
	bottleId: optionalStringCell,
	breast: breastSchema.optional(),
	durationInSeconds: z.number().nonnegative(),
	endTime: z.string().min(1),
	formulaProductId: optionalStringCell,
	milkType: milkTypeSchema.optional(),
	notes: optionalStringCell,
	startTime: z.string().min(1),
	type: feedingTypeSchema.default('breast'),
});

export const feedingFormSchema = z.object({
	amountMl: positiveNumericInputField('Amount must be a positive number').optional(),
	bottleId: z.string().optional(),
	breast: breastSchema.optional(),
	date: z.string().min(1),
	duration: numericInputField('Duration must be a positive number').optional(),
	formulaProductId: z.string().optional(),
	milkType: milkTypeSchema.optional(),
	notes: z.string().optional(),
	time: z.string().min(1),
	type: feedingTypeSchema,
});

export type FeedingFormValues = z.infer<typeof feedingFormSchema>;

export const feedingSessionFormToDataSchema = feedingFormSchema.transform(
	(values) => {
		const durationInMinutes = (values.duration && values.duration !== '') ? Number(values.duration) : 0;
		const amountMl = optionalNumberFromInputField('Amount must be a positive number').parse(values.amountMl);
		const [year, month, day] = values.date.split('-').map(Number);
		const [hours, minutes] = values.time.split(':').map(Number);

		const startTime = new Date(year, month - 1, day, hours, minutes);
		const endTime = new Date(
			startTime.getTime() + durationInMinutes * 60 * 1000,
		);

		return feedingSessionSharedSchema.parse({
			amountMl,
			bottleId: values.bottleId,
			breast: values.breast,
			durationInSeconds: durationInMinutes * 60,
			endTime: endTime.toISOString(),
			formulaProductId: values.formulaProductId,
			milkType: values.milkType,
			notes: values.notes,
			startTime: startTime.toISOString(),
			type: values.type,
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
	amountMl?: number;
	bottleId?: string;
	breast?: 'left' | 'right';
	durationInSeconds: number;
	endTime: string;
	formulaProductId?: string;
	milkType?: 'pumped' | 'formula';
	notes?: string;
	startTime: string;
	type: 'breast' | 'bottle' | 'pumping';
}
