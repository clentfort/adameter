import type { DiaperChange } from '@/types/diaper';
import { describe, expect, it } from 'vitest';

import { migrateDiaperChange } from './migration';

describe('migrateDiaperChange', () => {
	it('should not change records that already have potty data', () => {
		const record = {
			abnormalities: 'Urin abgehalten',
			containsUrine: true,
			id: '1',
			pottyStool: false,
			pottyUrine: true,
			timestamp: Date.now(),
		} as DiaperChange;
		expect(migrateDiaperChange(record)).toBe(record);
	});

	it('should migrate "Urin abgehalten"', () => {
		const record = {
			abnormalities: 'Urin abgehalten',
			containsStool: false,
			containsUrine: true,
			id: '1',
			timestamp: Date.now(),
		} as DiaperChange;
		const migrated = migrateDiaperChange(record);
		expect(migrated.pottyUrine).toBe(true);
		expect(migrated.containsUrine).toBe(true);
	});

	it('should migrate "Stuhl abgehalten"', () => {
		const record = {
			abnormalities: 'Stuhl abgehalten',
			containsStool: true,
			containsUrine: false,
			id: '1',
			timestamp: Date.now(),
		} as DiaperChange;
		const migrated = migrateDiaperChange(record);
		expect(migrated.pottyStool).toBe(true);
		expect(migrated.containsStool).toBe(true);
	});

	it('should handle "Windel trocken"', () => {
		const record = {
			abnormalities: 'Windel trocken, Urin abgehalten',
			containsStool: false,
			containsUrine: true,
			id: '1',
			timestamp: Date.now(),
		} as DiaperChange;
		const migrated = migrateDiaperChange(record);
		expect(migrated.pottyUrine).toBe(true);
		expect(migrated.containsUrine).toBe(false);
		expect(migrated.containsStool).toBe(false);
	});

	it('should handle both urine and stool', () => {
		const record = {
			abnormalities: 'Beides abgehalten',
			containsStool: true,
			containsUrine: true,
			id: '1',
			timestamp: Date.now(),
		} as DiaperChange;
		const migrated = migrateDiaperChange(record);
		expect(migrated.pottyUrine).toBe(true);
		expect(migrated.pottyStool).toBe(true);
	});
});
