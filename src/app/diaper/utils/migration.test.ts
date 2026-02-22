import type { DiaperChange } from '@/types/diaper';
import { describe, expect, it } from 'vitest';
import { migrateDiaperChanges } from './migration';

describe('migrateDiaperChanges', () => {
	it('should migrate German phrases correctly', () => {
		const changes: DiaperChange[] = [
			{
				abnormalities: 'Urin abgehalten',
				containsStool: false,
				containsUrine: true,
				id: '1',
				timestamp: '2024-01-01T10:00:00Z',
			},
			{
				abnormalities: 'Stuhl abgehalten',
				containsStool: true,
				containsUrine: true,
				id: '2',
				timestamp: '2024-01-01T11:00:00Z',
			},
			{
				abnormalities: 'Windel trocken, Urin abgehalten',
				containsStool: false,
				containsUrine: true,
				id: '3',
				timestamp: '2024-01-01T12:00:00Z',
			},
			{
				abnormalities: 'Some other note',
				containsStool: false,
				containsUrine: true,
				id: '4',
				timestamp: '2024-01-01T13:00:00Z',
			},
		];

		const { hasChanges, migrated } = migrateDiaperChanges(changes);

		expect(hasChanges).toBe(true);
		expect(migrated[0].pottyUrine).toBe(true);
		expect(migrated[0].pottyStool).toBe(false);
		expect(migrated[0].containsUrine).toBe(true);

		expect(migrated[1].pottyStool).toBe(true);
		expect(migrated[1].containsStool).toBe(true);

		expect(migrated[2].containsUrine).toBe(false);
		expect(migrated[2].pottyUrine).toBe(true);

		expect(migrated[3].pottyUrine).toBe(false);
		expect(migrated[3].pottyStool).toBe(false);
		expect(migrated[3].containsUrine).toBe(true);
	});

	it('should not migrate already migrated changes', () => {
		const changes: DiaperChange[] = [
			{
				containsStool: false,
				containsUrine: true,
				id: '1',
				pottyStool: false,
				pottyUrine: true,
				timestamp: '2024-01-01T10:00:00Z',
			},
		];

		const { hasChanges } = migrateDiaperChanges(changes);
		expect(hasChanges).toBe(false);
	});
});
