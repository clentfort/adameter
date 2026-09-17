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

	it('displays error when geolocation is not supported', () => {
		const onChange = vi.fn();

		vi.stubGlobal('navigator', {});

		render(<LocationPicker onChange={onChange} />);

		fireEvent.click(screen.getByTestId('get-location-button'));

		expect(
			screen.getByText(
				'Geolocation is not supported by your device or browser.',
			),
		).toBeInTheDocument();

		vi.unstubAllGlobals();
	});

	it('shows loading state while acquiring location', () => {
		const onChange = vi.fn();
		let successCallback: ((pos: unknown) => void) | undefined;

		const mockGetCurrentPosition = vi.fn((success) => {
			successCallback = success;
		});

		vi.stubGlobal('navigator', {
			geolocation: {
				getCurrentPosition: mockGetCurrentPosition,
			},
		});

		render(<LocationPicker onChange={onChange} />);

		fireEvent.click(screen.getByTestId('get-location-button'));

		expect(screen.getByText('Acquiring location...')).toBeInTheDocument();
		expect(screen.getByTestId('get-location-button')).toBeDisabled();

		// Complete position acquisition
		if (successCallback) {
			successCallback({
				coords: { latitude: 10, longitude: 20 },
			});
		}

		expect(onChange).toHaveBeenCalledWith(10, 20);

		vi.unstubAllGlobals();
	});

	it('displays appropriate error messages for position unavailable, timeout, or generic error', () => {
		const onChange = vi.fn();

		const testError = (
			errorCodeObj: Record<string, number>,
			expectedMessage: string,
		) => {
			const mockGetCurrentPosition = vi.fn((_success, error) => {
				error(errorCodeObj);
			});

			vi.stubGlobal('navigator', {
				geolocation: {
					getCurrentPosition: mockGetCurrentPosition,
				},
			});

			const { unmount } = render(<LocationPicker onChange={onChange} />);
			fireEvent.click(screen.getByTestId('get-location-button'));
			expect(screen.getByText(expectedMessage)).toBeInTheDocument();
			unmount();
			vi.unstubAllGlobals();
		};

		testError(
			{ code: 2, POSITION_UNAVAILABLE: 2 },
			'Location information is unavailable.',
		);
		testError({ code: 3, TIMEOUT: 3 }, 'Location request timed out.');
		testError({ code: 99 }, 'Unable to retrieve your location.');
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
		expect(screen.getByText('Update Current Location')).toBeInTheDocument();

		fireEvent.click(screen.getByTestId('clear-location-button'));
		expect(onChange).toHaveBeenCalledWith(undefined, undefined);
	});
});
