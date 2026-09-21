import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { STORE_VALUE_FULLSCREEN_MODE } from '@/lib/tinybase-sync/constants';
import {
	createTestStore,
	TinyBaseTestWrapper,
} from '@/test-utils/tinybase-test-wrapper';
import SettingsPage from './page';

vi.mock('next/navigation', () => ({
	useRouter: () => ({
		push: vi.fn(),
	}),
}));

describe('SettingsPage', () => {
	it('renders settings links and fullscreen toggle button', async () => {
		const store = createTestStore();
		store.setValue(STORE_VALUE_FULLSCREEN_MODE, true);

		const exitFullscreenMock = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(document, 'exitFullscreen', {
			configurable: true,
			value: exitFullscreenMock,
		});

		render(
			<TinyBaseTestWrapper store={store}>
				<SettingsPage />
			</TinyBaseTestWrapper>,
		);

		expect(screen.getByTestId('settings-profile')).toBeInTheDocument();
		expect(screen.getByTestId('settings-appearance')).toBeInTheDocument();
		expect(screen.getByTestId('settings-sharing')).toBeInTheDocument();
		expect(screen.getByTestId('settings-diapers')).toBeInTheDocument();
		expect(screen.getByTestId('settings-data')).toBeInTheDocument();

		const fullscreenBtn = screen.getByTestId('settings-fullscreen');
		expect(fullscreenBtn).toBeInTheDocument();
		expect(screen.getByText('Exit Fullscreen')).toBeInTheDocument();

		await userEvent.click(fullscreenBtn);
		expect(store.getValue(STORE_VALUE_FULLSCREEN_MODE)).toBe(false);
	});
});
