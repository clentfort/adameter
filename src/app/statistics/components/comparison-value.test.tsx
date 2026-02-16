import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ComparisonValue from './comparison-value';

describe('ComparisonValue', () => {
	it('should render correctly for various comparison scenarios', () => {
		// 1. Return null if previous is 0
		const { container, rerender } = render(
			<ComparisonValue current={10} previous={0} />,
		);
		expect(container.firstChild).toBeNull();

		// 2. Return null if percent change is < 0.1%
		rerender(<ComparisonValue current={100.05} previous={100} />);
		expect(container.firstChild).toBeNull();

		// 3. Render increase (emerald color)
		rerender(<ComparisonValue current={120} previous={100} />);
		const increaseElement = screen.getByText('↑20%');
		expect(increaseElement).toBeInTheDocument();
		expect(increaseElement).toHaveClass('text-emerald-600');

		// 4. Render decrease (rose color)
		rerender(<ComparisonValue current={80} previous={100} />);
		const decreaseElement = screen.getByText('↓20%');
		expect(decreaseElement).toBeInTheDocument();
		expect(decreaseElement).toHaveClass('text-rose-600');

		// 5. Render inverse increase (rose color)
		rerender(<ComparisonValue current={120} previous={100} inverse />);
		const inverseIncreaseElement = screen.getByText('↑20%');
		expect(inverseIncreaseElement).toHaveClass('text-rose-600');

		// 6. Render inverse decrease (emerald color)
		rerender(<ComparisonValue current={80} previous={100} inverse />);
		const inverseDecreaseElement = screen.getByText('↓20%');
		expect(inverseDecreaseElement).toHaveClass('text-emerald-600');
	});
});
