import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import { describe, expect, it } from 'vitest';
import {
	getDisposableAverageAround,
	getDisposableChanges,
	isSavedByPotty,
} from './diaper-savings';

describe('diaper-savings utils', () => {
	describe('isSavedByPotty', () => {
		it('returns true when potty urine hit but no diaper urine', () => {
			expect(
				isSavedByPotty({
					containsStool: false,
					containsUrine: false,
					pottyStool: false,
					pottyUrine: true,
				}),
			).toBe(true);
		});

		it('returns true when potty stool hit but no diaper stool', () => {
			expect(
				isSavedByPotty({
					containsStool: false,
					containsUrine: true,
					pottyStool: true,
					pottyUrine: false,
				}),
			).toBe(true);
		});

		it('returns false when potty urine hit but diaper also contains urine', () => {
			expect(
				isSavedByPotty({
					containsStool: false,
					containsUrine: true,
					pottyStool: false,
					pottyUrine: true,
				}),
			).toBe(false);
		});

		it('returns false when no potty hits occurred', () => {
			expect(
				isSavedByPotty({
					containsStool: true,
					containsUrine: true,
					pottyStool: false,
					pottyUrine: false,
				}),
			).toBe(false);
		});
	});

	describe('getDisposableChanges', () => {
		const disposableProduct: DiaperProduct = {
			costPerDiaper: 0.25,
			id: 'prod-disposable',
			isReusable: false,
			name: 'Baby-Dry',
		};

		const freeProduct: DiaperProduct = {
			costPerDiaper: 0,
			id: 'prod-free',
			isReusable: false,
			name: 'Free Sample',
		};

		const reusableProduct: DiaperProduct = {
			costPerDiaper: 0.1,
			id: 'prod-reusable',
			isReusable: true,
			name: 'Pocket',
		};

		const productById = new Map<string, DiaperProduct>([
			['prod-disposable', disposableProduct],
			['prod-free', freeProduct],
			['prod-reusable', reusableProduct],
		]);

		it('filters changes to non-reusable products with costPerDiaper > 0 and finite', () => {
			const changes: DiaperChange[] = [
				{
					containsStool: false,
					containsUrine: true,
					diaperProductId: 'prod-disposable',
					id: 'c1',
					timestamp: '2025-01-01T10:00:00.000Z',
				},
				{
					containsStool: false,
					containsUrine: true,
					diaperProductId: 'prod-free',
					id: 'c2',
					timestamp: '2025-01-01T12:00:00.000Z',
				},
				{
					containsStool: false,
					containsUrine: true,
					diaperProductId: 'prod-reusable',
					id: 'c3',
					timestamp: '2025-01-01T14:00:00.000Z',
				},
				{
					containsStool: false,
					containsUrine: true,
					id: 'c4',
					timestamp: '2025-01-01T16:00:00.000Z',
				},
			];

			const result = getDisposableChanges(changes, productById);
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				cost: 0.25,
				timestamp: new Date('2025-01-01T10:00:00.000Z'),
			});
		});

		it('handles non-numeric or non-finite costPerDiaper values', () => {
			const invalidProduct: DiaperProduct = {
				costPerDiaper: Number.NaN,
				id: 'prod-nan',
				isReusable: false,
				name: 'Nan',
			};
			const localMap = new Map([['prod-nan', invalidProduct]]);
			const changes: DiaperChange[] = [
				{
					containsStool: false,
					containsUrine: true,
					diaperProductId: 'prod-nan',
					id: 'c1',
					timestamp: '2025-01-01T10:00:00.000Z',
				},
			];

			expect(getDisposableChanges(changes, localMap)).toEqual([]);
		});
	});

	describe('getDisposableAverageAround', () => {
		const disposableChanges = [
			{ cost: 0.2, timestamp: new Date('2025-01-01T10:00:00.000Z') },
			{ cost: 0.4, timestamp: new Date('2025-01-05T10:00:00.000Z') },
			{ cost: 0.6, timestamp: new Date('2025-01-20T10:00:00.000Z') },
		];

		it('averages costs within 7 days of target date', () => {
			const targetDate = new Date('2025-01-03T10:00:00.000Z');
			const avg = getDisposableAverageAround(targetDate, disposableChanges);
			expect(avg).toBeCloseTo(0.3);
		});

		it('returns null if no disposable changes are within 7 days', () => {
			const targetDate = new Date('2025-02-01T10:00:00.000Z');
			const avg = getDisposableAverageAround(targetDate, disposableChanges);
			expect(avg).toBeNull();
		});

		it('returns null if disposable changes list is empty', () => {
			const targetDate = new Date('2025-01-03T10:00:00.000Z');
			const avg = getDisposableAverageAround(targetDate, []);
			expect(avg).toBeNull();
		});
	});
});
