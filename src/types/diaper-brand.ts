import type { BaseEntity } from './base-entity';

export interface DiaperBrand extends BaseEntity {
	/** Cost per single diaper (for disposables or liners). */
	costPerDiaper: number;
	/** Whether the brand is reusable. */
	isReusable: boolean;
	/** Name of the diaper brand. */
	name: string;
	/** Usage cost per diaper change (e.g. washing, liners). */
	perUseCost?: number;
	/** Upfront cost for the brand (e.g. for a set of reusable diapers). */
	upfrontCost: number;
}
