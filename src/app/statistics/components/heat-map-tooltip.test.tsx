import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HeatMapTooltip } from './heat-map-tooltip';

describe('HeatMapTooltip', () => {
	const mockInterval = { count: 5, time: '10:00' };

	beforeEach(() => {
		vi.stubGlobal('innerWidth', 1000);
	});

	it('renders correctly with interval data', () => {
		const mockContainerRect = { left: 0 } as DOMRect;
		const { getByText } = render(
			<HeatMapTooltip
				activeInterval={mockInterval}
				containerRect={mockContainerRect}
				pointerX={300}
			/>,
		);

		expect(getByText('10:00')).toBeInTheDocument();
		expect(getByText('5 Feedings')).toBeInTheDocument();
	});

	it('renders singular feeding count correctly', () => {
		const mockContainerRect = { left: 0 } as DOMRect;
		const { getByText } = render(
			<HeatMapTooltip
				activeInterval={{ count: 1, time: '12:00' }}
				containerRect={mockContainerRect}
				pointerX={300}
			/>,
		);

		expect(getByText('1 Feeding')).toBeInTheDocument();
	});

	it('clamps position to viewport on the left edge', () => {
		// Interaction at abs X = 10. Bubble wants to be at 10.
		// min abs X = 64 + 8 = 72.
		const mockContainerRect = { left: 0 } as DOMRect;
		const { container } = render(
			<HeatMapTooltip
				activeInterval={mockInterval}
				containerRect={mockContainerRect}
				pointerX={10}
			/>,
		);

		const tooltip = container.firstChild as HTMLElement;
		// absClampedX = 72. clampedX = 72 - 0 = 72.
		expect(tooltip.style.left).toBe('72px');

		// triangleOffset = absInteractionX - absClampedX = 10 - 72 = -62.
		// clamped to -50.
		const pin = container.querySelector('.origin-center');
		expect((pin as HTMLElement).style.transform).toContain(
			'translateX(calc(-50% + -50px))',
		);
	});

	it('clamps position to viewport on the right edge', () => {
		vi.stubGlobal('innerWidth', 400);

		// Interaction at abs X = 390. Bubble wants to be at 390.
		// max abs X = 400 - 64 - 8 = 328.
		const mockContainerRect = { left: 0 } as DOMRect;
		const { container } = render(
			<HeatMapTooltip
				activeInterval={mockInterval}
				containerRect={mockContainerRect}
				pointerX={390}
			/>,
		);

		const tooltip = container.firstChild as HTMLElement;
		expect(tooltip.style.left).toBe('328px');

		// triangleOffset = 390 - 328 = 62.
		// clamped to 50.
		const pin = container.querySelector('.origin-center');
		expect((pin as HTMLElement).style.transform).toContain(
			'translateX(calc(-50% + 50px))',
		);
	});

	it('aligns the pin triangle correctly when centered', () => {
		const mockContainerRect = { left: 100 } as DOMRect;
		const { container } = render(
			<HeatMapTooltip
				activeInterval={mockInterval}
				containerRect={mockContainerRect}
				pointerX={300}
			/>,
		);

		// absInteractionX = 400. InnerWidth 1000. No clamping.
		const pin = container.querySelector('.origin-center');
		expect((pin as HTMLElement).style.transform).toContain(
			'translateX(calc(-50% + 0px))',
		);
	});
});
