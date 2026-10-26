import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import { describe, expect, it } from 'vitest';
import { createDiaperChanges } from '@/test-utils/factories/diaper-change';
import {
	calculateReusableSavingsMetrics,
	estimateBreakEvenDate,
	findBreakEvenDate,
	getHypotheticalDisposableCost,
	getReusableChanges,
	getUpfrontCostTotal,
} from './reusable-savings';

const allChanges: DiaperChange[] = createDiaperChanges([
	{
		containsStool: false,
		containsUrine: true,
		diaperProductId: 'product-a',
		timestamp: '2026-02-01T10:00:00.000Z',
	},
	{
		containsStool: false,
		containsUrine: true,
		diaperProductId: 'product-r',
		timestamp: '2026-02-02T10:00:00.000Z',
	},
	{
		containsStool: true,
		containsUrine: true,
		diaperProductId: 'product-b',
		timestamp: '2026-02-03T10:00:00.000Z',
	},
	{
		containsStool: false,
		containsUrine: true,
		diaperProductId: 'product-r',
		timestamp: '2026-02-04T10:00:00.000Z',
	},
	{
		containsStool: false,
		containsUrine: false,
		pottyUrine: true,
		timestamp: '2026-02-05T10:00:00.000Z',
	},
]);

const products: DiaperProduct[] = [
	{ costPerDiaper: 0.3, id: 'product-a', isReusable: false, name: 'Brand A' },
	{ costPerDiaper: 0.5, id: 'product-b', isReusable: false, name: 'Brand B' },
	{
		costPerDiaper: 0.4,
		id: 'product-r',
		isReusable: true,
		name: 'Reusable Hero',
		upfrontCost: 0.6,
	},
];

const productById = new Map(products.map((p) => [p.id, p]));

describe('reusable-savings utils', () => {
	describe('getUpfrontCostTotal', () => {
		it('sums valid upfront costs for reusable products', () => {
			expect(getUpfrontCostTotal(products.filter((p) => p.isReusable))).toBe(
				0.6,
			);
		});

		it('ignores invalid or missing upfront cost values', () => {
			const badProducts: DiaperProduct[] = [
				{
					costPerDiaper: 0.5,
					id: 'p1',
					isReusable: true,
					name: 'P1',
					upfrontCost: Number.NaN,
				},
				{
					costPerDiaper: 0.5,
					id: 'p2',
					isReusable: true,
					name: 'P2',
					upfrontCost: Infinity,
				},
				{ costPerDiaper: 0.5, id: 'p3', isReusable: true, name: 'P3' },
			];
			expect(getUpfrontCostTotal(badProducts)).toBe(0);
		});
	});

	describe('getReusableChanges', () => {
		it('filters reusable diaper changes and extracts reusable costs', () => {
			const reusableChanges = getReusableChanges(allChanges, productById);
			expect(reusableChanges).toHaveLength(2);
			expect(reusableChanges[0].reusableCost).toBe(0.4);
			expect(reusableChanges[1].reusableCost).toBe(0.4);
		});
	});

	describe('findBreakEvenDate', () => {
		it('returns null when savings events are empty', () => {
			expect(findBreakEvenDate([], 10)).toBeNull();
		});

		it('returns the timestamp when running savings become >= 0', () => {
			const date1 = new Date('2026-02-01');
			const date2 = new Date('2026-02-02');
			const events = [
				{ contribution: 5, timestamp: date1 },
				{ contribution: 6, timestamp: date2 },
			];
			expect(findBreakEvenDate(events, 10)).toEqual(date2);
		});
	});

	describe('estimateBreakEvenDate', () => {
		it('returns null if totalSavings >= 0 or events are empty', () => {
			expect(estimateBreakEvenDate([], -10)).toBeNull();
			expect(
				estimateBreakEvenDate([{ contribution: 5, timestamp: new Date() }], 5),
			).toBeNull();
		});

		it('estimates break even date when total savings is negative and contribution rate is positive', () => {
			const d1 = new Date('2026-02-01T10:00:00.000Z');
			const d2 = new Date('2026-02-02T10:00:00.000Z');
			const events = [
				{ contribution: 0.2, timestamp: d1 },
				{ contribution: 0.2, timestamp: d2 },
			];
			const est = estimateBreakEvenDate(events, -1.0);
			expect(est).toBeDefined();
			expect(est?.toISOString()).toBe('2026-02-07T10:00:00.000Z');
		});
	});

	describe('getHypotheticalDisposableCost', () => {
		it('calculates hypothetical disposable cost using 7-day average or non-reusable product fallback', () => {
			const cost = getHypotheticalDisposableCost(allChanges, productById, [
				{ cost: 0.3, timestamp: new Date('2026-02-01T10:00:00.000Z') },
				{ cost: 0.5, timestamp: new Date('2026-02-03T10:00:00.000Z') },
			]);
			expect(cost).toBeCloseTo(2.0, 2);
		});

		it('ignores non-reusable products with costPerDiaper of Infinity', () => {
			const infProduct: DiaperProduct = {
				costPerDiaper: Infinity,
				id: 'p-inf',
				isReusable: false,
				name: 'Inf Product',
			};
			const infChange = createDiaperChanges([
				{
					containsStool: false,
					containsUrine: true,
					diaperProductId: 'p-inf',
					timestamp: '2026-02-01T10:00:00.000Z',
				},
			]);
			const map = new Map([[infProduct.id, infProduct]]);
			expect(getHypotheticalDisposableCost(infChange, map, [])).toBe(0);
		});

		it('ignores non-reusable products with costPerDiaper of -1', () => {
			const negProduct: DiaperProduct = {
				costPerDiaper: -1,
				id: 'p-neg',
				isReusable: false,
				name: 'Neg Product',
			};
			const negChange = createDiaperChanges([
				{
					containsStool: false,
					containsUrine: true,
					diaperProductId: 'p-neg',
					timestamp: '2026-02-01T10:00:00.000Z',
				},
			]);
			const map = new Map([[negProduct.id, negProduct]]);
			expect(getHypotheticalDisposableCost(negChange, map, [])).toBe(0);
		});
	});

	describe('calculateReusableSavingsMetrics', () => {
		it('returns null when no reusable products exist', () => {
			const noReusableMap = new Map(
				products.filter((p) => !p.isReusable).map((p) => [p.id, p]),
			);
			expect(
				calculateReusableSavingsMetrics(allChanges, noReusableMap),
			).toBeNull();
		});

		it('calculates correct metrics for standard reusable changes and potty events', () => {
			const metrics = calculateReusableSavingsMetrics(allChanges, productById);
			expect(metrics).not.toBeNull();
			expect(metrics?.upfrontCostTotal).toBe(0.6);
			expect(metrics?.usageCost).toBe(0.8);
			expect(metrics?.totalCost).toBe(1.4);
			expect(metrics?.hypotheticalDisposableCost).toBeCloseTo(2.0, 2);
			expect(metrics?.totalSavings).toBeCloseTo(-0.2, 2);
		});

		it('calculates estimated break-even date when savings are negative but contribution is positive', () => {
			const estChanges: DiaperChange[] = createDiaperChanges([
				{
					containsStool: false,
					containsUrine: true,
					diaperProductId: 'product-disposable-1',
					timestamp: '2026-02-01T10:00:00.000Z',
				},
				{
					containsStool: false,
					containsUrine: true,
					diaperProductId: 'product-reusable-1',
					timestamp: '2026-02-02T10:00:00.000Z',
				},
			]);

			const estProducts: DiaperProduct[] = [
				{
					costPerDiaper: 0.3,
					id: 'product-disposable-1',
					isReusable: false,
					name: 'Disposable Hero',
				},
				{
					costPerDiaper: 0.1,
					id: 'product-reusable-1',
					isReusable: true,
					name: 'Reusable Hero',
					upfrontCost: 10.0,
				},
			];
			const estMap = new Map(estProducts.map((p) => [p.id, p]));

			const metrics = calculateReusableSavingsMetrics(estChanges, estMap);
			expect(metrics?.breakEvenDate).toBeNull();
			expect(metrics?.estimatedBreakEvenDate).not.toBeNull();
		});

		it('returns null for break-even when break-even is not possible due to negative contribution', () => {
			const cheapChanges: DiaperChange[] = createDiaperChanges([
				{
					containsStool: false,
					containsUrine: true,
					diaperProductId: 'product-disposable-cheap',
					timestamp: '2026-02-01T10:00:00.000Z',
				},
				{
					containsStool: false,
					containsUrine: true,
					diaperProductId: 'product-reusable-expensive',
					timestamp: '2026-02-02T10:00:00.000Z',
				},
			]);

			const cheapProducts: DiaperProduct[] = [
				{
					costPerDiaper: 0.2,
					id: 'product-disposable-cheap',
					isReusable: false,
					name: 'Cheap Disposable',
				},
				{
					costPerDiaper: 0.5,
					id: 'product-reusable-expensive',
					isReusable: true,
					name: 'Expensive Reusable',
					upfrontCost: 10.0,
				},
			];
			const cheapMap = new Map(cheapProducts.map((p) => [p.id, p]));

			const metrics = calculateReusableSavingsMetrics(cheapChanges, cheapMap);
			expect(metrics?.breakEvenDate).toBeNull();
			expect(metrics?.estimatedBreakEvenDate).toBeNull();
		});

		it('handles extreme/invalid product fields gracefully', () => {
			const badChanges: DiaperChange[] = createDiaperChanges([
				{
					containsStool: false,
					containsUrine: true,
					diaperProductId: 'product-bad-upfront',
					timestamp: '2026-02-01T10:00:00.000Z',
				},
				{
					containsStool: false,
					containsUrine: true,
					diaperProductId: 'product-bad-cost',
					timestamp: '2026-02-02T10:00:00.000Z',
				},
				{
					containsStool: false,
					containsUrine: true,
					diaperProductId: undefined,
					timestamp: '2026-02-03T10:00:00.000Z',
				},
				{
					containsStool: false,
					containsUrine: true,
					diaperProductId: 'unknown-product',
					timestamp: '2026-02-04T10:00:00.000Z',
				},
			]);

			const badProducts: DiaperProduct[] = [
				{
					costPerDiaper: Infinity,
					id: 'product-bad-upfront',
					isReusable: true,
					name: 'Bad Upfront',
					upfrontCost: Number.NaN,
				},
				{
					costPerDiaper: Number.NaN,
					id: 'product-bad-cost',
					isReusable: true,
					name: 'Bad Cost',
					upfrontCost: 5.0,
				},
			];
			const badMap = new Map(badProducts.map((p) => [p.id, p]));

			const metrics = calculateReusableSavingsMetrics(badChanges, badMap);
			expect(metrics).not.toBeNull();
		});

		it('sets breakEvenDate when running savings reach zero or more', () => {
			const breakEvenChanges: DiaperChange[] = createDiaperChanges([
				{
					containsStool: false,
					containsUrine: true,
					diaperProductId: 'product-disposable-1',
					timestamp: '2026-02-01T10:00:00.000Z',
				},
				{
					containsStool: false,
					containsUrine: true,
					diaperProductId: 'product-reusable-1',
					timestamp: '2026-02-02T10:00:00.000Z',
				},
			]);

			const breakEvenProducts: DiaperProduct[] = [
				{
					costPerDiaper: 1.0,
					id: 'product-disposable-1',
					isReusable: false,
					name: 'Disposable Hero',
				},
				{
					costPerDiaper: 0.2,
					id: 'product-reusable-1',
					isReusable: true,
					name: 'Reusable Hero',
					upfrontCost: 0.5,
				},
			];
			const breakEvenMap = new Map(breakEvenProducts.map((p) => [p.id, p]));

			const metrics = calculateReusableSavingsMetrics(
				breakEvenChanges,
				breakEvenMap,
			);
			expect(metrics?.breakEvenDate).not.toBeNull();
		});

		it('triggers edge cases for invalid disposable cost and infinite disposable cost', () => {
			const edgeChanges: DiaperChange[] = createDiaperChanges([
				{
					containsStool: false,
					containsUrine: true,
					diaperProductId: 'product-disposable-nan',
					timestamp: '2026-02-01T10:00:00.000Z',
				},
				{
					containsStool: false,
					containsUrine: true,
					diaperProductId: 'product-disposable-inf',
					timestamp: '2026-02-02T10:00:00.000Z',
				},
				{
					containsStool: false,
					containsUrine: true,
					diaperProductId: 'product-reusable-1',
					timestamp: '2026-02-03T10:00:00.000Z',
				},
			]);

			const edgeProducts: DiaperProduct[] = [
				{
					costPerDiaper: Number.NaN,
					id: 'product-disposable-nan',
					isReusable: false,
					name: 'NaN Disposable',
				},
				{
					costPerDiaper: Infinity,
					id: 'product-disposable-inf',
					isReusable: false,
					name: 'Inf Disposable',
				},
				{
					costPerDiaper: 0.1,
					id: 'product-reusable-1',
					isReusable: true,
					name: 'Reusable Hero',
					upfrontCost: 1.0,
				},
			];
			const edgeMap = new Map(edgeProducts.map((p) => [p.id, p]));

			const metrics = calculateReusableSavingsMetrics(edgeChanges, edgeMap);
			expect(metrics).not.toBeNull();
		});

		it('triggers edge cases for potty stool and empty average disposable around potty events', () => {
			const pottyChanges: DiaperChange[] = createDiaperChanges([
				{
					containsStool: false,
					containsUrine: true,
					diaperProductId: 'product-disposable-1',
					timestamp: '2026-02-01T10:00:00.000Z',
				},
				{
					containsStool: false,
					containsUrine: false,
					pottyStool: true,
					timestamp: '2026-02-02T10:00:00.000Z',
				},
				{
					containsStool: false,
					containsUrine: false,
					pottyUrine: true,
					timestamp: '2026-02-20T10:00:00.000Z',
				},
				{
					containsStool: false,
					containsUrine: true,
					diaperProductId: 'product-reusable-1',
					timestamp: '2026-02-03T10:00:00.000Z',
				},
			]);

			const pottyProducts: DiaperProduct[] = [
				{
					costPerDiaper: 0.3,
					id: 'product-disposable-1',
					isReusable: false,
					name: 'Disposable Hero',
				},
				{
					costPerDiaper: 0.1,
					id: 'product-reusable-1',
					isReusable: true,
					name: 'Reusable Hero',
					upfrontCost: 1.0,
				},
			];
			const pottyMap = new Map(pottyProducts.map((p) => [p.id, p]));

			const metrics = calculateReusableSavingsMetrics(pottyChanges, pottyMap);
			expect(metrics).not.toBeNull();
		});
	});
});
