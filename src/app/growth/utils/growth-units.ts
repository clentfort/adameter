import type { GrowthFormData, GrowthFormValues } from '@/types/growth';
import {
	cmToInches,
	gramsToLbs,
	inchesToCm,
	lbsToGrams,
} from '@/utils/unit-conversions';

export function toDisplayValues(
	values: GrowthFormValues,
	isImperial: boolean,
): GrowthFormValues {
	const result = { ...values };

	if (!isImperial) {
		return result;
	}

	if (result.weight) {
		const grams = Number.parseFloat(result.weight);
		if (!Number.isNaN(grams)) {
			result.weight = gramsToLbs(grams).toFixed(1);
		}
	}

	if (result.height) {
		const cm = Number.parseFloat(result.height);
		if (!Number.isNaN(cm)) {
			result.height = cmToInches(cm).toFixed(1);
		}
	}

	if (result.headCircumference) {
		const cm = Number.parseFloat(result.headCircumference);
		if (!Number.isNaN(cm)) {
			result.headCircumference = cmToInches(cm).toFixed(1);
		}
	}

	return result;
}

export function toMetric(
	data: GrowthFormData,
	isImperial: boolean,
): GrowthFormData {
	let weight = data.weight;
	let height = data.height;
	let headCircumference = data.headCircumference;

	if (isImperial) {
		if (weight != null) {
			weight = Math.round(lbsToGrams(weight));
		}
		if (height != null) {
			height = Math.round(inchesToCm(height) * 10) / 10;
		}
		if (headCircumference != null) {
			headCircumference = Math.round(inchesToCm(headCircumference) * 10) / 10;
		}
	}

	return {
		...data,
		headCircumference,
		height,
		weight,
	};
}
