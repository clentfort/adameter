import type { BaseEntity } from './base-entity';

export interface DiaperBrand extends BaseEntity {
	/** Cost per single diaper (for disposables or liners). */
	costPerDiaper: number;
	/** Whether the brand is reusable. */
	isReusable: boolean;
	/** Name of the diaper brand. */
	name: string;
	/** Upfront cost for the brand (e.g. for a set of reusable diapers). */
	upfrontCost: number;
}
