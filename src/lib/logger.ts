type LogLevel = 'log' | 'error' | 'warn' | 'info';

type LogEntry = {
	args: unknown[];
	method: LogLevel;
	timestamp: number;
};

type Listener = (entry: LogEntry) => void;

class Logger {
	private listeners: Set<Listener> = new Set();

	log(...args: unknown[]) {
		this.emit('log', args);
	}

	error(...args: unknown[]) {
		this.emit('error', args);
	}

	warn(...args: unknown[]) {
		this.emit('warn', args);
	}

	info(...args: unknown[]) {
		this.emit('info', args);
	}

	subscribe(listener: Listener) {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private emit(method: LogLevel, args: unknown[]) {
		const entry: LogEntry = {
			args,
			method,
			timestamp: Date.now(),
		};

		// Also log to actual console for normal dev workflow
		/* eslint-disable no-console */
		console[method](...args);
		/* eslint-enable no-console */

		this.listeners.forEach((listener) => listener(entry));
	}
}

export const logger = new Logger();
