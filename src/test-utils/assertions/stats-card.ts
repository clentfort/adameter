import { within } from '@testing-library/react';
import { expect } from 'vitest';

function getStatsCardPrimaryMetric(
	scope: HTMLElement,
	expectedValue: number | string,
) {
	const normalizedExpectedValue = String(expectedValue);

	return within(scope).getByText((_, element) => {
		return (
			element?.classList.contains('text-2xl') === true &&
			element.textContent?.trim() === normalizedExpectedValue
		);
	});
}

export function expectStatsCardPrimaryMetric(
	scope: HTMLElement,
	expectedValue: number | string,
) {
	expect(getStatsCardPrimaryMetric(scope, expectedValue)).toBeInTheDocument();
}
