/**
 * Weight conversions
 */
const GRAMS_PER_LB = 453.59237;
const GRAMS_PER_OZ = 28.3495231;

export function gramsToLbs(grams: number): number {
	return grams / GRAMS_PER_LB;
}

export function lbsToGrams(lbs: number): number {
	return lbs * GRAMS_PER_LB;
}

export function gramsToLbsOz(grams: number): { lbs: number; oz: number } {
	const totalOz = grams / GRAMS_PER_OZ;
	const lbs = Math.floor(totalOz / 16);
	const oz = Math.round((totalOz % 16) * 10) / 10;
	return { lbs, oz };
}

export function lbsOzToGrams(lbs: number, oz: number): number {
	return Math.round((lbs * 16 + oz) * GRAMS_PER_OZ);
}

/**
 * Length conversions
 */
const CM_PER_INCH = 2.54;

export function cmToInches(cm: number): number {
	return Math.round((cm / CM_PER_INCH) * 100) / 100;
}

export function inchesToCm(inches: number): number {
	return Math.round(inches * CM_PER_INCH * 10) / 10;
}

/**
 * Temperature conversions
 */
export function celsiusToFahrenheit(celsius: number): number {
	return Math.round((celsius * 1.8 + 32) * 10) / 10;
}

export function fahrenheitToCelsius(fahrenheit: number): number {
	return Math.round(((fahrenheit - 32) / 1.8) * 10) / 10;
}
