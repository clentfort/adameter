import { describe, expect, it, vi } from 'vitest';
import { logger } from './logger';

describe('Logger', () => {
	it('should support subscribe and all log methods', () => {
		const listener = vi.fn();
		const unsubscribe = logger.subscribe(listener);

		const logArgs = ['test log', { foo: 'bar' }];
		const errorArgs = ['test error', 123];
		const warnArgs = ['test warn'];
		const infoArgs = ['test info'];

		// Spy on console methods to avoid actual output during tests
		const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
		const consoleError = vi
			.spyOn(console, 'error')
			.mockImplementation(() => {});
		const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});

		logger.log(...logArgs);
		logger.error(...errorArgs);
		logger.warn(...warnArgs);
		logger.info(...infoArgs);

		expect(listener).toHaveBeenCalledTimes(4);
		expect(consoleLog).toHaveBeenCalledWith(...logArgs);
		expect(consoleError).toHaveBeenCalledWith(...errorArgs);
		expect(consoleWarn).toHaveBeenCalledWith(...warnArgs);
		expect(consoleInfo).toHaveBeenCalledWith(...infoArgs);

		const entries = listener.mock.calls.map((call) => call[0]);
		expect(entries[0].method).toBe('log');
		expect(entries[0].args).toEqual(logArgs);
		expect(entries[1].method).toBe('error');
		expect(entries[1].args).toEqual(errorArgs);
		expect(entries[2].method).toBe('warn');
		expect(entries[2].args).toEqual(warnArgs);
		expect(entries[3].method).toBe('info');
		expect(entries[3].args).toEqual(infoArgs);

		unsubscribe();
		logger.log('after unsubscribe');
		expect(listener).toHaveBeenCalledTimes(4);

		consoleLog.mockRestore();
		consoleError.mockRestore();
		consoleWarn.mockRestore();
		consoleInfo.mockRestore();
	});
});
