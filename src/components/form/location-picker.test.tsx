import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LocationPicker } from './location-picker';

describe('LocationPicker', () => {
	it('renders use current location button', () => {
		const onChange = vi.fn();
		render(<LocationPicker onChange={onChange} />);

		expect(screen.getByTestId('get-location-button')).toBeInTheDocument();
		expect(
			screen.queryByTestId('toggle-manual-location-button'),
		).not.toBeInTheDocument();
	});

	it('handles geolocation acquisition successfully', () => {
		const onChange = vi.fn();
		const mockGetCurrentPosition = vi.fn((success) => {
			success({
				coords: {
					latitude: 52.520_008,
					longitude: 13.404_954,
				},
			});
		});

		vi.stubGlobal('navigator', {
			geolocation: {
				getCurrentPosition: mockGetCurrentPosition,
			},
		});

		render(<LocationPicker onChange={onChange} />);

		fireEvent.click(screen.getByTestId('get-location-button'));

		expect(mockGetCurrentPosition).toHaveBeenCalled();
		expect(onChange).toHaveBeenCalledWith(52.520_01, 13.404_95);

		vi.unstubAllGlobals();
	});

	it('displays error when geolocation permission is denied', () => {
		const onChange = vi.fn();
		const mockGetCurrentPosition = vi.fn((_success, error) => {
			error({ code: 1, PERMISSION_DENIED: 1 });
		});

		vi.stubGlobal('navigator', {
			geolocation: {
				getCurrentPosition: mockGetCurrentPosition,
			},
		});

		render(<LocationPicker onChange={onChange} />);

		fireEvent.click(screen.getByTestId('get-location-button'));

		expect(screen.getByText('Location access was denied.')).toBeInTheDocument();

		vi.unstubAllGlobals();
	});

	it('renders location coordinates display and clear button when location is present', () => {
		const onChange = vi.fn();
		render(
			<LocationPicker
				latitude={52.52}
				longitude={13.405}
				onChange={onChange}
			/>,
		);

		expect(screen.getByText('52.52, 13.405')).toBeInTheDocument();

		fireEvent.click(screen.getByTestId('clear-location-button'));
		expect(onChange).toHaveBeenCalledWith(undefined, undefined);
	});
});
