import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HeaderIndicator from './header-indicator';

describe('HeaderIndicator', () => {
	it('should render label and children', () => {
		render(
			<HeaderIndicator icon="👶" label="Test Label">
				<div data-testid="child">Test Content</div>
			</HeaderIndicator>,
		);

		expect(screen.getByText('Test Label')).toBeDefined();
		expect(screen.getByTestId('child')).toBeDefined();
		expect(screen.getByText('👶')).toBeDefined();
	});
});
