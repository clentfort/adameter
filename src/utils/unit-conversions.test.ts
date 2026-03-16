import { describe, expect, it } from 'vitest';
import {
	celsiusToFahrenheit,
	cmToInches,
	fahrenheitToCelsius,
	gramsToLbs,
	gramsToLbsOz,
	inchesToCm,
	lbsOzToGrams,
	lbsToGrams,
} from './unit-conversions';

describe('unit-conversions', () => {
	describe('weight', () => {
		it('converts grams to lbs', () => {
			expect(gramsToLbs(453.592_37)).toBeCloseTo(1);
			expect(gramsToLbs(3500)).toBeCloseTo(7.716, 2);
		});

		it('converts lbs to grams', () => {
			expect(lbsToGrams(1)).toBeCloseTo(453.592_37);
			expect(lbsToGrams(7.716)).toBeCloseTo(3500, 0);
		});

		it('converts grams to lbs/oz', () => {
			const result = gramsToLbsOz(3500);
			expect(result.lbs).toBe(7);
			expect(result.oz).toBeCloseTo(11.5, 0);
		});

		it('converts lbs/oz to grams', () => {
			expect(lbsOzToGrams(7, 11.5)).toBeCloseTo(3500, -1);
		});

		it('round-trips grams through lbs/oz', () => {
			const grams = 4200;
			const { lbs, oz } = gramsToLbsOz(grams);
			expect(lbsOzToGrams(lbs, oz)).toBeCloseTo(grams, -1);
		});
	});

	describe('length', () => {
		it('converts cm to inches', () => {
			expect(cmToInches(2.54)).toBeCloseTo(1);
			expect(cmToInches(50)).toBeCloseTo(19.685, 2);
		});

		it('converts inches to cm', () => {
			expect(inchesToCm(1)).toBeCloseTo(2.54);
			expect(inchesToCm(19.685)).toBeCloseTo(50, 0);
		});
	});

	describe('temperature', () => {
		it('converts Celsius to Fahrenheit', () => {
			expect(celsiusToFahrenheit(0)).toBeCloseTo(32);
			expect(celsiusToFahrenheit(37)).toBeCloseTo(98.6);
			expect(celsiusToFahrenheit(100)).toBeCloseTo(212);
		});

		it('converts Fahrenheit to Celsius', () => {
			expect(fahrenheitToCelsius(32)).toBeCloseTo(0);
			expect(fahrenheitToCelsius(98.6)).toBeCloseTo(37);
			expect(fahrenheitToCelsius(212)).toBeCloseTo(100);
		});
	});
});
