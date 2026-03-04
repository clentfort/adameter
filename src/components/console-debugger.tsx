'use client';

import { Terminal, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDevMode } from '@/hooks/use-dev-mode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

type LogEntry = {
	args: unknown[];
	id: number;
	method: 'log' | 'error' | 'warn' | 'info';
	timestamp: number;
};

export default function ConsoleDebugger() {
	const [devMode] = useDevMode();
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [isOpen, setIsOpen] = useState(false);
	const logsRef = useRef<LogEntry[]>([]);

	const addLog = useCallback(
		(method: LogEntry['method'], args: unknown[]) => {
			const newLog: LogEntry = {
				args,
				id: Date.now() + Math.random(),
				method,
				timestamp: Date.now(),
			};
			logsRef.current = [...logsRef.current, newLog].slice(-100);
			setLogs(logsRef.current);
		},
		[],
	);

	useEffect(() => {
		if (!devMode) return;

		const originalConsole = {
			/* eslint-disable no-console */
			error: console.error,
			info: console.info,
			log: console.log,
			warn: console.warn,
			/* eslint-enable no-console */
		};

		/* eslint-disable no-console */
		console.log = (...args: unknown[]) => {
			addLog('log', args);
			originalConsole.log(...args);
		};
		console.error = (...args: unknown[]) => {
			addLog('error', args);
			originalConsole.error(...args);
		};
		console.warn = (...args: unknown[]) => {
			addLog('warn', args);
			originalConsole.warn(...args);
		};
		console.info = (...args: unknown[]) => {
			addLog('info', args);
			originalConsole.info(...args);
		};
		/* eslint-enable no-console */

		return () => {
			/* eslint-disable no-console */
			console.log = originalConsole.log;
			console.error = originalConsole.error;
			console.warn = originalConsole.warn;
			console.info = originalConsole.info;
			/* eslint-enable no-console */
		};
	}, [devMode, addLog]);

	if (!devMode) return null;

	return (
		<>
			<div className="fixed bottom-20 right-4 z-[100]">
				<Button
					className="rounded-full h-12 w-12 shadow-lg"
					onClick={() => setIsOpen(true)}
					size="icon"
					variant="secondary"
				>
					<Terminal className="h-6 w-6" />
					{logs.length > 0 && (
						<span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] h-[20px] flex items-center justify-center border-2 border-background">
							{logs.length > 99 ? '99+' : logs.length}
						</span>
					)}
				</Button>
			</div>

			{isOpen && (
				<div className="fixed inset-0 z-[110] bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
					<Card className="w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl border-2">
						<CardHeader className="flex flex-row items-center justify-between border-b px-4 py-3 shrink-0">
							<CardTitle className="text-lg font-bold flex items-center gap-2">
								<Terminal className="h-5 w-5" />
								<fbt desc="Console Debugger title">Console Logs</fbt>
							</CardTitle>
							<div className="flex items-center gap-2">
								<Button
									onClick={() => {
										logsRef.current = [];
										setLogs([]);
									}}
									size="icon"
									variant="ghost"
								>
									<Trash2 className="h-4 w-4" />
								</Button>
								<Button onClick={() => setIsOpen(false)} size="icon" variant="ghost">
									<X className="h-5 w-5" />
								</Button>
							</div>
						</CardHeader>
						<CardContent className="flex-grow overflow-hidden p-0">
							<ScrollArea className="h-full">
								<div className="p-2 space-y-1 font-mono text-xs">
									{logs.length === 0 ? (
										<div className="p-8 text-center text-muted-foreground italic">
											<fbt desc="No logs message">No logs captured yet.</fbt>
										</div>
									) : (
										logs.map((log) => (
											<div
												className={`p-2 rounded border-l-4 ${
													log.method === 'error'
														? 'bg-destructive/10 border-destructive text-destructive'
														: log.method === 'warn'
															? 'bg-amber-100 border-amber-500 text-amber-700 dark:bg-amber-900/20'
															: 'bg-muted border-muted-foreground/30'
												}`}
												key={log.id}
											>
												<div className="flex justify-between items-start mb-1 opacity-50">
													<span className="uppercase text-[10px] font-bold">
														{log.method}
													</span>
													<span>
														{new Date(log.timestamp).toLocaleTimeString()}
													</span>
												</div>
												<div className="whitespace-pre-wrap break-all">
													{log.args.map((arg, i) => (
														<span key={i}>
															{typeof arg === 'object'
																? JSON.stringify(arg, null, 2)
																: String(arg)}
															{' '}
														</span>
													))}
												</div>
											</div>
										))
									)}
								</div>
							</ScrollArea>
						</CardContent>
					</Card>
				</div>
			)}
		</>
	);
}
