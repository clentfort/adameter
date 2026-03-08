import { z } from 'zod';

export const baseEntitySchema = z.object({
	deviceId: z.string().optional(),
	id: z.string(),
});

export interface BaseEntity {
	deviceId?: string;
	id: string;
}
