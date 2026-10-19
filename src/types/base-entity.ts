import { z } from 'zod';
import { optionalNumberCell, optionalStringCell } from './schema-utils';

export const baseEntitySchema = z.object({
	deviceId: z.string().optional(),
	id: z.string(),
	locationLatitude: optionalNumberCell,
	locationLongitude: optionalNumberCell,
	notes: optionalStringCell,
	profileId: z.string().optional(),
});

export type BaseEntity = z.infer<typeof baseEntitySchema>;
