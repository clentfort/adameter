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
			expect(gramsToLbs(453.592_37)).toBe(1);
			expect(gramsToLbs(3000)).toBeCloseTo(6.61, 2);
		});

		it('converts lbs to grams', () => {
			expect(lbsToGrams(1)).toBe(453.592_37);
		});

		it('converts grams to lbs and oz', () => {
			const result = gramsToLbsOz(3487);
			expect(result.lbs).toBe(7);
			expect(result.oz).toBeCloseTo(11, 1);
		});

		it('converts lbs and oz to grams', () => {
			expect(lbsOzToGrams(7, 11)).toBe(3487);
		});
	});

	describe('length', () => {
		it('converts cm to inches', () => {
			expect(cmToInches(2.54)).toBe(1);
			expect(cmToInches(50)).toBe(19.69);
		});

		it('converts inches to cm', () => {
			expect(inchesToCm(1)).toBe(2.5);
			expect(inchesToCm(20)).toBe(50.8);
		});
	});

	describe('temperature', () => {
		it('converts Celsius to Fahrenheit', () => {
			expect(celsiusToFahrenheit(0)).toBe(32);
			expect(celsiusToFahrenheit(37)).toBe(98.6);
			expect(celsiusToFahrenheit(100)).toBe(212);
		});

		it('converts Fahrenheit to Celsius', () => {
			expect(fahrenheitToCelsius(32)).toBe(0);
			expect(fahrenheitToCelsius(98.6)).toBe(37);
			expect(fahrenheitToCelsius(212)).toBe(100);
		});
	});
});
