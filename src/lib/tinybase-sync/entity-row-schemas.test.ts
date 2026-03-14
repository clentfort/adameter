import { describe, expect, it } from 'vitest';
import { TABLE_IDS } from './constants';
import {
	sanitizeDiaperProductForStore,
	sanitizeEventForStore,
	sanitizeFeedingSessionForStore,
	sanitizeGrowthMeasurementForStore,
	sanitizeImportedRow,
	sanitizeToothForStore,
} from './entity-row-schemas';

describe('entity row schemas', () => {
	it('drops blank optional diaper product cells during CSV import', () => {
		const sanitizedRow = sanitizeImportedRow(TABLE_IDS.DIAPER_PRODUCTS, {
			costPerDiaper: '',
			deviceId: 'device-1',
			id: 'product-1',
			isReusable: false,
			name: 'Rossmann',
			upfrontCost: '',
		});

		expect(sanitizedRow).toEqual({
			deviceId: 'device-1',
			isReusable: false,
			name: 'Rossmann',
		});
	});

	it('sanitizes event writes before persisting them', () => {
		expect(
			sanitizeEventForStore({
				color: '#123456',
				description: '  milestone  ',
				id: 'event-1',
				startDate: '2026-03-07T08:00:00.000Z',
				title: '  Checkup  ',
				type: 'point',
			}),
		).toEqual({
			color: '#123456',
			description: 'milestone',
			startDate: '2026-03-07T08:00:00.000Z',
			title: 'Checkup',
			type: 'point',
		});
	});

	it('sanitizes feeding session writes before persisting them', () => {
		expect(
			sanitizeFeedingSessionForStore({
				breast: 'left',
				durationInSeconds: 600,
				endTime: '2026-03-07T08:10:00.000Z',
				id: 'feeding-1',
				startTime: '2026-03-07T08:00:00.000Z',
				type: 'breast',
			}),
		).toEqual({
			breast: 'left',
			durationInSeconds: 600,
			endTime: '2026-03-07T08:10:00.000Z',
			startTime: '2026-03-07T08:00:00.000Z',
			type: 'breast',
		});
	});

	it('sanitizes growth measurement writes before persisting them', () => {
		expect(
			sanitizeGrowthMeasurementForStore({
				date: '2026-03-07T12:00:00.000Z',
				height: 51.2,
				id: 'growth-1',
				notes: '  thriving  ',
			}),
		).toEqual({
			date: '2026-03-07T12:00:00.000Z',
			height: 51.2,
			notes: 'thriving',
		});
	});

	it('sanitizes tooth writes before persisting them', () => {
		expect(
			sanitizeToothForStore({
				date: '2026-03-07T12:00:00.000Z',
				id: 'tooth-1',
				notes: '  first sighting  ',
				toothId: 51,
			}),
		).toEqual({
			date: '2026-03-07T12:00:00.000Z',
			notes: 'first sighting',
			toothId: 51,
		});
	});

	it('sanitizes diaper product writes before persisting them', () => {
		expect(
			sanitizeDiaperProductForStore({
				archived: false,
				costPerDiaper: 0.1,
				id: 'product-1',
				isReusable: true,
				name: 'Judes',
				upfrontCost: undefined,
			}),
		).toEqual({
			archived: false,
			costPerDiaper: 0.1,
			isReusable: true,
			name: 'Judes',
		});
	});
});
