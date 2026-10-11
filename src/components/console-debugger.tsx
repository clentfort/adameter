'use client';

import { Copy, Terminal, Trash2, X } from 'lucide-react';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DataSynchronizationContext } from '@/contexts/data-synchronization-context';
import { useDevMode } from '@/hooks/use-dev-mode';
import { logger } from '@/lib/logger';
import { PARTYKIT_HOST } from '@/lib/partykit-host';

type LogEntry = {
	args: unknown[];
	id: number;
	method: 'log' | 'error' | 'warn' | 'info';
	timestamp: number;
};

export default function ConsoleDebugger() {
	const [devMode] = useDevMode();
	const { room } = useContext(DataSynchronizationContext);
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [isOpen, setIsOpen] = useState(false);
	const logsRef = useRef<LogEntry[]>([]);

	const addLog = useCallback(
		(method: LogEntry['method'], args: unknown[], timestamp: number) => {
			const newLog: LogEntry = {
				args,
				id: Math.random(),
				method,
				timestamp,
			};
			logsRef.current = [...logsRef.current, newLog].slice(-100);
			setLogs(logsRef.current);
		},
		[],
	);

	const copyToClipboard = useCallback(() => {
		const text = logs
			.map(
				(log) =>
					`[${new Date(log.timestamp).toISOString()}] [${log.method.toUpperCase()}] ${log.args
						.map((arg) =>
							typeof arg === 'object'
								? JSON.stringify(arg, null, 2)
								: String(arg),
						)
						.join(' ')}`,
			)
			.join('\n');
		void navigator.clipboard.writeText(text);
	}, [logs]);

	useEffect(() => {
		if (!devMode) return;

		const unsubscribe = logger.subscribe((entry) => {
			addLog(entry.method, entry.args, entry.timestamp);
		});
		return () => {
			unsubscribe();
		};
	}, [devMode, addLog]);

	if (!devMode) return null;

	return (
		<>
			<div className="fixed bottom-20 right-4 z-[100]">
				<Button
					aria-label="Open debug console"
					className="rounded-full h-12 w-12 shadow-lg"
					data-testid="console-debugger-trigger"
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
						<CardHeader className="flex flex-col border-b px-4 py-3 shrink-0 gap-2">
							<div className="flex flex-row items-center justify-between">
								<CardTitle className="text-lg font-bold flex items-center gap-2">
									<Terminal className="h-5 w-5" />
									<fbt desc="Console Debugger title">Console Logs</fbt>
								</CardTitle>
								<div className="flex items-center gap-2">
									<Button
										aria-label="Copy logs"
										data-testid="console-debugger-copy"
										disabled={logs.length === 0}
										onClick={copyToClipboard}
										size="icon"
										variant="ghost"
									>
										<Copy className="h-4 w-4" />
									</Button>
									<Button
										aria-label="Clear logs"
										data-testid="console-debugger-clear"
										onClick={() => {
											logsRef.current = [];
											setLogs([]);
										}}
										size="icon"
										variant="ghost"
									>
										<Trash2 className="h-4 w-4" />
									</Button>
									<Button
										aria-label="Close debug console"
										data-testid="console-debugger-close"
										onClick={() => setIsOpen(false)}
										size="icon"
										variant="ghost"
									>
										<X className="h-5 w-5" />
									</Button>
								</div>
							</div>
							<div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 font-mono bg-muted/50 px-2.5 py-1 rounded border">
								<div className="flex items-center gap-1.5">
									<span className="font-semibold text-foreground">
										<fbt desc="Backend label in console debugger">Backend:</fbt>
									</span>
									<span className="truncate">{PARTYKIT_HOST}</span>
								</div>
								{room && (
									<div className="flex items-center gap-1.5">
										<span className="font-semibold text-foreground">
											<fbt desc="Room label in console debugger">Room:</fbt>
										</span>
										<span className="truncate">{room}</span>
									</div>
								)}
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
																: String(arg)}{' '}
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
