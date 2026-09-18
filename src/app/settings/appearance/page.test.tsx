import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
	STORE_VALUE_CURRENCY,
	STORE_VALUE_DEV_MODE,
	STORE_VALUE_LOCATION_TRACKING,
	STORE_VALUE_SHOW_FEEDING,
	STORE_VALUE_TIME_FORMAT,
	STORE_VALUE_UNIT_SYSTEM,
} from '@/lib/tinybase-sync/constants';
import {
	createTestStore,
	TinyBaseTestWrapper,
} from '@/test-utils/tinybase-test-wrapper';
import AppearanceSettingsPage from './page';

const mockSetTheme = vi.fn();

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('next-themes', () => ({
	useTheme: () => ({ setTheme: mockSetTheme, theme: 'light' }),
}));

describe('AppearanceSettingsPage', () => {
	it('renders location tracking switch and updates value when toggled', () => {
		const store = createTestStore();
		render(
			<TinyBaseTestWrapper store={store}>
				<AppearanceSettingsPage />
			</TinyBaseTestWrapper>,
		);

		const switchElement = screen.getByRole('switch', {
			name: /location tracking/i,
		});
		expect(switchElement).toBeChecked();

		fireEvent.click(switchElement);

		expect(store.getValue(STORE_VALUE_LOCATION_TRACKING)).toBe(false);
	});

	it('handles changing selects and switches for all appearance settings', async () => {
		const user = userEvent.setup();
		const store = createTestStore();

		render(
			<TinyBaseTestWrapper store={store}>
				<AppearanceSettingsPage />
			</TinyBaseTestWrapper>,
		);

		// Test switches
		const butterflySwitch = screen.getByRole('switch', {
			name: /butterfly charts/i,
		});
		fireEvent.click(butterflySwitch);
		expect(butterflySwitch).not.toBeChecked();

		const showFeedingSwitch = screen.getByRole('switch', {
			name: /show feeding/i,
		});
		fireEvent.click(showFeedingSwitch);
		expect(store.getValue(STORE_VALUE_SHOW_FEEDING)).toBe(false);

		const devModeSwitch = screen.getByRole('switch', {
			name: /dev mode/i,
		});
		fireEvent.click(devModeSwitch);
		expect(store.getValue(STORE_VALUE_DEV_MODE)).toBe(true);

		// Test selects: Language, Time Format, Unit System, Theme, Currency
		const comboboxes = screen.getAllByRole('combobox');
		expect(comboboxes.length).toBeGreaterThanOrEqual(5);

		// Language select (0)
		await user.click(comboboxes[0]);
		const germanOption = await screen.findByRole('option', { name: /german/i });
		await user.click(germanOption);

		// Time format select (1)
		await user.click(comboboxes[1]);
		const timeFormatOption = await screen.findByRole('option', {
			name: /24-hour/i,
		});
		await user.click(timeFormatOption);
		expect(store.getValue(STORE_VALUE_TIME_FORMAT)).toBe('24h');

		// Unit system select (2)
		await user.click(comboboxes[2]);
		const imperialOption = await screen.findByRole('option', {
			name: /imperial/i,
		});
		await user.click(imperialOption);
		expect(store.getValue(STORE_VALUE_UNIT_SYSTEM)).toBe('imperial');

		// Theme select (3)
		await user.click(comboboxes[3]);
		const darkOption = await screen.findByRole('option', { name: /dark/i });
		await user.click(darkOption);
		expect(mockSetTheme).toHaveBeenCalledWith('dark');

		// Currency select (4)
		await user.click(comboboxes[4]);
		const eurOption = await screen.findByRole('option', { name: /eur/i });
		await user.click(eurOption);
		expect(store.getValue(STORE_VALUE_CURRENCY)).toBe('EUR');
	});
});
