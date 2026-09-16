import { act, render, screen } from '@testing-library/react';
import { useTheme } from 'next-themes';
import { describe, expect, it, vi } from 'vitest';
import { LocationMap } from './location-map';

const mockMapRemove = vi.fn();
const mockTileLayerAddTo = vi.fn();
const mockMarkerAddTo = vi.fn();
const mockMap = vi.fn((_element: HTMLElement, _options?: unknown) => ({
	remove: mockMapRemove,
}));
const mockTileLayer = vi.fn((_urlTemplate: string, _options?: unknown) => ({
	addTo: mockTileLayerAddTo,
}));
const mockDivIcon = vi.fn((_options?: unknown) => ({}));
const mockMarker = vi.fn((_latlng: unknown, _options?: unknown) => ({
	addTo: mockMarkerAddTo,
}));

vi.mock('leaflet', () => {
	const leafletMock = {
		divIcon: (options?: unknown) => mockDivIcon(options),
		map: (element: HTMLElement, options?: unknown) => mockMap(element, options),
		marker: (latlng: unknown, options?: unknown) => mockMarker(latlng, options),
		tileLayer: (urlTemplate: string, options?: unknown) =>
			mockTileLayer(urlTemplate, options),
	};
	return {
		...leafletMock,
		default: leafletMock,
	};
});

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

	it('initializes Leaflet map, clears _leaflet_id if present, and removes map on unmount', async () => {
		const { container, rerender, unmount } = render(
			<LocationMap latitude={10} longitude={20} />,
		);

		await act(async () => {
			await Promise.resolve();
		});

		expect(mockMap).toHaveBeenCalledWith(
			expect.any(HTMLDivElement),
			expect.objectContaining({
				center: [10, 20],
				zoom: 15,
			}),
		);
		expect(mockTileLayer).toHaveBeenCalledWith(
			'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
			{ maxZoom: 19 },
		);
		expect(mockMarker).toHaveBeenCalledWith([10, 20], expect.any(Object));

		// Set _leaflet_id on map container div to test cleanup pathway when props update/re-render
		const mapContainer = container.querySelector(
			'[role="region"]',
		) as HTMLDivElement & { _leaflet_id?: number | null };
		if (mapContainer) {
			mapContainer._leaflet_id = 123;
		}

		rerender(<LocationMap latitude={10.1} longitude={20.1} />);

		await act(async () => {
			await Promise.resolve();
		});

		if (mapContainer) {
			expect(mapContainer._leaflet_id).toBeNull();
		}

		unmount();
		expect(mockMapRemove).toHaveBeenCalled();
	});
});
