import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LocationMap } from './location-map';

describe('LocationMap', () => {
	it('renders OpenStreetMap iframe and coordinates with external link', () => {
		render(<LocationMap latitude={52.52} longitude={13.405} />);

		expect(screen.getByTestId('location-map')).toBeInTheDocument();

		const iframe = screen.getByTitle('Location map') as HTMLIFrameElement;
		expect(iframe).toBeInTheDocument();
		expect(iframe.src).toContain('openstreetmap.org/export/embed.html');
		expect(iframe.src).toContain('marker=52.52%2C13.405');

		expect(screen.getByText('52.52000, 13.40500')).toBeInTheDocument();
		expect(
			screen.getByRole('link', { name: /view on openstreetmap/i }),
		).toHaveAttribute(
			'href',
			'https://www.openstreetmap.org/?mlat=52.52&mlon=13.405#map=16/52.52/13.405',
		);
	});
});
