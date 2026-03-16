const GRAMS_PER_POUND = 453.592_37;
const OUNCES_PER_POUND = 16;
const CM_PER_INCH = 2.54;

// Weight: grams <-> pounds
export function gramsToLbs(grams: number): number {
	return grams / GRAMS_PER_POUND;
}

export function lbsToGrams(lbs: number): number {
	return lbs * GRAMS_PER_POUND;
}

// Weight: grams <-> lbs + oz (split display)
export function gramsToLbsOz(grams: number): { lbs: number; oz: number } {
	const totalOz = (grams / GRAMS_PER_POUND) * OUNCES_PER_POUND;
	const lbs = Math.floor(totalOz / OUNCES_PER_POUND);
	const oz = Math.round((totalOz % OUNCES_PER_POUND) * 10) / 10;
	return { lbs, oz };
}

export function lbsOzToGrams(lbs: number, oz: number): number {
	return (lbs + oz / OUNCES_PER_POUND) * GRAMS_PER_POUND;
}

// Length: cm <-> inches
export function cmToInches(cm: number): number {
	return cm / CM_PER_INCH;
}

export function inchesToCm(inches: number): number {
	return inches * CM_PER_INCH;
}

// Temperature: Celsius <-> Fahrenheit
export function celsiusToFahrenheit(celsius: number): number {
	return (celsius * 9) / 5 + 32;
}

export function fahrenheitToCelsius(fahrenheit: number): number {
	return ((fahrenheit - 32) * 5) / 9;
}
