import { z } from 'zod';
import { optionalStringCell } from './schema-utils';

export const baseEntitySchema = z.object({
	deviceId: z.string().optional(),
	id: z.string(),
	notes: optionalStringCell,
	profileId: z.string().optional(),
});

export interface BaseEntity {
	deviceId?: string;
	id: string;
	notes?: string;
	profileId?: string;
}
