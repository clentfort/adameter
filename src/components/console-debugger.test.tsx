import type { JoinStrategy } from '@/contexts/data-synchronization-context';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore } from 'tinybase';
import { Provider } from 'tinybase/ui-react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataSynchronizationContext } from '@/contexts/data-synchronization-context';
import { logger } from '@/lib/logger';
import { PARTYKIT_HOST } from '@/lib/partykit-host';
import { STORE_VALUE_DEV_MODE } from '@/lib/tinybase-sync/constants';
import ConsoleDebugger from './console-debugger';

function renderConsoleDebugger({
	devMode = true,
	room = undefined as string | undefined,
} = {}) {
	const store = createStore();
	store.setValue(STORE_VALUE_DEV_MODE, devMode);

	const syncContextValue = {
		isHydrated: true,
		joinRoom: vi.fn(),
		joinStrategy: 'merge' as JoinStrategy,
		leaveRoom: vi.fn(),
		resetJoinStrategy: vi.fn(),
		room,
		setRoom: vi.fn(),
	};

	return {
		store,
		...render(
			<Provider store={store}>
				<DataSynchronizationContext.Provider value={syncContextValue}>
					<ConsoleDebugger />
				</DataSynchronizationContext.Provider>
			</Provider>,
		),
	};
}

describe('ConsoleDebugger', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should not render anything when devMode is disabled', () => {
		renderConsoleDebugger({ devMode: false });
		expect(
			screen.queryByTestId('console-debugger-trigger'),
		).not.toBeInTheDocument();
	});

	it('should render floating terminal button when devMode is enabled', () => {
		renderConsoleDebugger({ devMode: true });
		expect(screen.getByTestId('console-debugger-trigger')).toBeInTheDocument();
	});

	it('should open modal and display backend host and room name', async () => {
		const user = userEvent.setup();
		renderConsoleDebugger({ devMode: true, room: 'my-test-room' });

		await user.click(screen.getByTestId('console-debugger-trigger'));

		expect(screen.getByText('Console Logs')).toBeInTheDocument();
		expect(screen.getByText('Backend:')).toBeInTheDocument();
		expect(screen.getByText(PARTYKIT_HOST)).toBeInTheDocument();
		expect(screen.getByText('Room:')).toBeInTheDocument();
		expect(screen.getByText('my-test-room')).toBeInTheDocument();
	});

	it('should display logs and handle clearing and copying', async () => {
		const user = userEvent.setup();
		const writeTextSpy = vi
			.spyOn(navigator.clipboard, 'writeText')
			.mockResolvedValue(undefined);

		renderConsoleDebugger({ devMode: true });

		act(() => {
			logger.log('Test log message');
			logger.warn('Test warn message');
			logger.error('Test error message');
		});

		await user.click(screen.getByTestId('console-debugger-trigger'));

		expect(screen.getByText(/Test log message/)).toBeInTheDocument();
		expect(screen.getByText(/Test warn message/)).toBeInTheDocument();
		expect(screen.getByText(/Test error message/)).toBeInTheDocument();

		// Copy logs
		const copyButton = screen.getByTestId('console-debugger-copy');
		expect(copyButton).not.toBeDisabled();
		await user.click(copyButton);

		expect(writeTextSpy).toHaveBeenCalledTimes(1);
		expect(writeTextSpy).toHaveBeenCalledWith(
			expect.stringContaining('Test log message'),
		);

		// Clear logs
		const clearButton = screen.getByTestId('console-debugger-clear');
		await user.click(clearButton);
		expect(screen.getByText('No logs captured yet.')).toBeInTheDocument();
	});

	it('should close the modal when X button is clicked', async () => {
		const user = userEvent.setup();
		renderConsoleDebugger({ devMode: true });

		await user.click(screen.getByTestId('console-debugger-trigger'));
		expect(screen.getByText('Console Logs')).toBeInTheDocument();

		await user.click(screen.getByTestId('console-debugger-close'));
		expect(screen.queryByText('Console Logs')).not.toBeInTheDocument();
	});
});
