import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { STORE_VALUE_FULLSCREEN_MODE } from '@/lib/tinybase-sync/constants';
import {
	createTestStore,
	TinyBaseTestWrapper,
} from '@/test-utils/tinybase-test-wrapper';
import { useFullscreen } from './use-fullscreen';

describe('useFullscreen', () => {
	it('should return fullscreenMode true by default', () => {
		const { result } = renderHook(() => useFullscreen(), {
			wrapper: TinyBaseTestWrapper,
		});
		expect(result.current.fullscreenMode).toBe(true);
		expect(result.current.isFullscreen).toBe(false);
	});

	it('should set and return a new fullscreenMode value', () => {
		const store = createTestStore();
		const { result } = renderHook(() => useFullscreen(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});

		act(() => {
			result.current.setFullscreenMode(false);
		});

		expect(result.current.fullscreenMode).toBe(false);
		expect(store.getValue(STORE_VALUE_FULLSCREEN_MODE)).toBe(false);
	});

	it('should call enterFullscreen and request document fullscreen', async () => {
		const store = createTestStore();
		const requestFullscreenMock = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(document.documentElement, 'requestFullscreen', {
			configurable: true,
			value: requestFullscreenMock,
		});

		const { result } = renderHook(() => useFullscreen(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});

		await act(async () => {
			await result.current.enterFullscreen();
		});

		expect(store.getValue(STORE_VALUE_FULLSCREEN_MODE)).toBe(true);
		expect(requestFullscreenMock).toHaveBeenCalled();
	});

	it('should call exitFullscreen and exit document fullscreen when element exists', async () => {
		const store = createTestStore();
		const exitFullscreenMock = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(document, 'exitFullscreen', {
			configurable: true,
			value: exitFullscreenMock,
		});
		Object.defineProperty(document, 'fullscreenElement', {
			configurable: true,
			value: document.documentElement,
		});

		const { result } = renderHook(() => useFullscreen(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});

		await act(async () => {
			await result.current.exitFullscreen();
		});

		expect(store.getValue(STORE_VALUE_FULLSCREEN_MODE)).toBe(false);
		expect(exitFullscreenMock).toHaveBeenCalled();

		// Cleanup mock
		Object.defineProperty(document, 'fullscreenElement', {
			configurable: true,
			value: null,
		});
	});

	it('should update isFullscreen state when fullscreenchange event fires', () => {
		const { result } = renderHook(() => useFullscreen(), {
			wrapper: TinyBaseTestWrapper,
		});

		Object.defineProperty(document, 'fullscreenElement', {
			configurable: true,
			value: document.documentElement,
		});

		act(() => {
			document.dispatchEvent(new Event('fullscreenchange'));
		});

		expect(result.current.isFullscreen).toBe(true);

		Object.defineProperty(document, 'fullscreenElement', {
			configurable: true,
			value: null,
		});

		act(() => {
			document.dispatchEvent(new Event('fullscreenchange'));
		});

		expect(result.current.isFullscreen).toBe(false);
	});
});
