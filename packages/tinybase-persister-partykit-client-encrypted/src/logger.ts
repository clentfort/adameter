type LogLevel = 'log' | 'error' | 'warn' | 'info';

export const logger = {
	error: (...args: unknown[]) => {
		/* eslint-disable no-console */
		console.error(...args);
		/* eslint-enable no-console */
	},
	info: (...args: unknown[]) => {
		/* eslint-disable no-console */
		console.info(...args);
		/* eslint-enable no-console */
	},
	log: (...args: unknown[]) => {
		/* eslint-disable no-console */
		console.log(...args);
		/* eslint-enable no-console */
	},
	warn: (...args: unknown[]) => {
		/* eslint-disable no-console */
		console.warn(...args);
		/* eslint-enable no-console */
	},
};
