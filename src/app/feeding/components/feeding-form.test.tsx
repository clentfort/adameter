import type { FeedingSession } from '@/types/feeding';
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STORE_VALUE_LOCATION_TRACKING } from '@/lib/tinybase-sync/constants';
import {
	createTestStore,
	TinyBaseTestWrapper,
} from '@/test-utils/tinybase-test-wrapper';
import FeedingForm from './feeding-form';

describe('FeedingForm', () => {
	const mockOnSave = vi.fn();
	const mockOnClose = vi.fn();

	const baseProps = {
		onClose: mockOnClose,
		onSave: mockOnSave,
		title: 'Edit Feeding',
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it('renders with initial data and calls onSave when submitted', async () => {
		const initialFeeding: FeedingSession = {
			breast: 'left',
			durationInSeconds: 600, // 10 minutes
			endTime: '2023-10-27T10:10:00.000Z',
			id: '1',
			startTime: '2023-10-27T10:00:00.000Z',
		};

		render(<FeedingForm {...baseProps} feeding={initialFeeding} />);

		// Check if initial values are set
		expect(screen.getByLabelText(/minutes/i)).toHaveValue(10);

		// Find the save button and click it
		const saveButton = screen.getByTestId('save-button');
		fireEvent.click(saveButton);

		await waitFor(() => expect(mockOnSave).toHaveBeenCalledTimes(1));
		const savedSession = mockOnSave.mock.calls[0][0];
		expect(savedSession.breast).toBe('left');
		expect(savedSession.durationInSeconds).toBe(600);
		expect(savedSession.id).toBe('1');
	});

	it('renders without initial data and allows saving new session', async () => {
		render(<FeedingForm {...baseProps} />);

		// Default should be left breast
		expect(screen.getByLabelText(/minutes/i)).toHaveValue(null);

		fireEvent.click(screen.getByTestId('right-breast-radio'));
		fireEvent.change(screen.getByLabelText(/minutes/i), {
			target: { value: '15' },
		});

		fireEvent.click(screen.getByTestId('save-button'));

		await waitFor(() => expect(mockOnSave).toHaveBeenCalledTimes(1));
		const savedSession = mockOnSave.mock.calls[0][0];
		expect(savedSession.breast).toBe('right');
		expect(savedSession.durationInSeconds).toBe(900);
	});

	it('does not call onSave if duration is invalid', () => {
		render(<FeedingForm {...baseProps} />);

		fireEvent.change(screen.getByLabelText(/minutes/i), {
			target: { value: '' },
		});
		fireEvent.click(screen.getByTestId('save-button'));

		expect(mockOnSave).not.toHaveBeenCalled();
	});

	it('automatically fetches location when adding a new feeding session within 15 mins', async () => {
		const store = createTestStore();
		const mockGetCurrentPosition = vi.fn((success) => {
			success({
				coords: {
					latitude: 48.8566,
					longitude: 2.3522,
				},
			});
		});

		vi.stubGlobal('navigator', {
			geolocation: {
				getCurrentPosition: mockGetCurrentPosition,
			},
		});

		render(
			<TinyBaseTestWrapper store={store}>
				<FeedingForm {...baseProps} />
			</TinyBaseTestWrapper>,
		);

		fireEvent.change(screen.getByLabelText(/minutes/i), {
			target: { value: '15' },
		});

		fireEvent.click(screen.getByTestId('save-button'));

		await waitFor(() => expect(mockOnSave).toHaveBeenCalledTimes(1));
		const savedSession = mockOnSave.mock.calls[0][0];
		expect(mockGetCurrentPosition).toHaveBeenCalled();
		expect(savedSession.locationLatitude).toBe(48.8566);
		expect(savedSession.locationLongitude).toBe(2.3522);
	});

	it('disables location tracking setting when location permission is denied', async () => {
		const store = createTestStore();
		store.setValue(STORE_VALUE_LOCATION_TRACKING, true);

		const mockGetCurrentPosition = vi.fn((_success, error) => {
			error({
				code: 1, // PERMISSION_DENIED
				PERMISSION_DENIED: 1,
			});
		});

		vi.stubGlobal('navigator', {
			geolocation: {
				getCurrentPosition: mockGetCurrentPosition,
			},
		});

		render(
			<TinyBaseTestWrapper store={store}>
				<FeedingForm {...baseProps} />
			</TinyBaseTestWrapper>,
		);

		fireEvent.change(screen.getByLabelText(/minutes/i), {
			target: { value: '10' },
		});

		fireEvent.click(screen.getByTestId('save-button'));

		await waitFor(() => expect(mockOnSave).toHaveBeenCalledTimes(1));
		expect(store.getValue(STORE_VALUE_LOCATION_TRACKING)).toBe(false);
	});

	it('preserves existing location when editing a feeding session without fetching location', async () => {
		const mockGetCurrentPosition = vi.fn();
		vi.stubGlobal('navigator', {
			geolocation: {
				getCurrentPosition: mockGetCurrentPosition,
			},
		});

		const initialFeeding: FeedingSession = {
			breast: 'left',
			durationInSeconds: 600,
			endTime: '2023-10-27T10:10:00.000Z',
			id: '1',
			locationLatitude: 12.345,
			locationLongitude: 67.89,
			startTime: '2023-10-27T10:00:00.000Z',
		};

		render(<FeedingForm {...baseProps} feeding={initialFeeding} />);

		fireEvent.click(screen.getByTestId('save-button'));

		await waitFor(() => expect(mockOnSave).toHaveBeenCalledTimes(1));
		const savedSession = mockOnSave.mock.calls[0][0];
		expect(mockGetCurrentPosition).not.toHaveBeenCalled();
		expect(savedSession.locationLatitude).toBe(12.345);
		expect(savedSession.locationLongitude).toBe(67.89);
	});
});
