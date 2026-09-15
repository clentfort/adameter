import { render, screen } from '@testing-library/react';
import { useTheme } from 'next-themes';
import { describe, expect, it, vi } from 'vitest';
import { LocationMap } from './location-map';

vi.mock('next-themes', () => ({
	useTheme: vi.fn(() => ({ resolvedTheme: 'light' })),
}));

describe('LocationMap', () => {
	it('renders map tile container, coordinates, and external link without iframe', () => {
		render(<LocationMap latitude={52.52} longitude={13.405} />);

		const mapElement = screen.getByTestId('location-map');
		expect(mapElement).toBeInTheDocument();
		expect(mapElement).toHaveAttribute('lang', 'en-US');

		// Ensure no iframe is rendered
		expect(screen.queryByTitle('Location map')).toBeNull();

		expect(screen.getByText('52.52000, 13.40500')).toBeInTheDocument();

		const link = screen.getByRole('link', { name: /view on openstreetmap/i });
		expect(link).toHaveAttribute(
			'href',
			'https://www.openstreetmap.org/?mlat=52.52&mlon=13.405#map=16/52.52/13.405',
		);
	});

	it('handles dark theme settings', () => {
		vi.mocked(useTheme).mockReturnValue({
			resolvedTheme: 'dark',
			setTheme: vi.fn(),
			theme: 'dark',
			themes: ['light', 'dark'],
		});

		render(<LocationMap latitude={40.7128} longitude={-74.006} />);

		expect(screen.getByTestId('location-map')).toBeInTheDocument();
		expect(screen.getByText('40.71280, -74.00600')).toBeInTheDocument();
	});
});
