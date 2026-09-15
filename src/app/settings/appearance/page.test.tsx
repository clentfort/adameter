import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { STORE_VALUE_LOCATION_TRACKING } from '@/lib/tinybase-sync/constants';
import {
	createTestStore,
	TinyBaseTestWrapper,
} from '@/test-utils/tinybase-test-wrapper';
import AppearanceSettingsPage from './page';

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('next-themes', () => ({
	useTheme: () => ({ setTheme: vi.fn(), theme: 'light' }),
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
});
