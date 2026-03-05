import { describe, expect, it, vi } from 'vitest';
import { logger } from './logger';

describe('logger', () => {
	it('logs messages', () => {
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
		logger.log('test message');
		expect(spy).toHaveBeenCalledWith('test message');
		spy.mockRestore();
	});

	it('errors messages', () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		logger.error('test error');
		expect(spy).toHaveBeenCalledWith('test error');
		spy.mockRestore();
	});

	it('warns messages', () => {
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		logger.warn('test warn');
		expect(spy).toHaveBeenCalledWith('test warn');
		spy.mockRestore();
	});

	it('infos messages', () => {
		const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
		logger.info('test info');
		expect(spy).toHaveBeenCalledWith('test info');
		spy.mockRestore();
	});
});
