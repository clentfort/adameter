import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { STORE_VALUE_FULLSCREEN_MODE } from '@/lib/tinybase-sync/constants';
import {
	createTestStore,
	TinyBaseTestWrapper,
} from '@/test-utils/tinybase-test-wrapper';
import { FullscreenHandler } from './fullscreen-handler';

describe('FullscreenHandler', () => {
	it('should request fullscreen on user interaction when fullscreenMode is true', () => {
		const store = createTestStore();
		store.setValue(STORE_VALUE_FULLSCREEN_MODE, true);

		const requestFullscreenMock = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(document.documentElement, 'requestFullscreen', {
			configurable: true,
			value: requestFullscreenMock,
		});

		render(
			<TinyBaseTestWrapper store={store}>
				<FullscreenHandler />
			</TinyBaseTestWrapper>,
		);

		window.dispatchEvent(new Event('pointerdown'));

		expect(requestFullscreenMock).toHaveBeenCalled();
	});

	it('should not request fullscreen on user interaction when fullscreenMode is false', () => {
		const store = createTestStore();
		store.setValue(STORE_VALUE_FULLSCREEN_MODE, false);

		const requestFullscreenMock = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(document.documentElement, 'requestFullscreen', {
			configurable: true,
			value: requestFullscreenMock,
		});

		render(
			<TinyBaseTestWrapper store={store}>
				<FullscreenHandler />
			</TinyBaseTestWrapper>,
		);

		window.dispatchEvent(new Event('pointerdown'));

		expect(requestFullscreenMock).not.toHaveBeenCalled();
	});
});
