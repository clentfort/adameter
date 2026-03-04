'use client';

import { fbt } from 'fbtee';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { useDevMode } from '@/hooks/use-dev-mode';
import { Button } from '@/components/ui/button';

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const [devMode] = useDevMode();

	return (
		<div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center space-y-6">
			<div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
				<AlertTriangle className="h-10 w-10" />
			</div>

			<div className="space-y-2">
				<h2 className="text-2xl font-bold tracking-tight">
					<fbt desc="Error title">Something went wrong!</fbt>
				</h2>
				<p className="text-muted-foreground max-w-[250px] mx-auto">
					<fbt desc="Error description">
						An unexpected error occurred. We've been notified and are working to
						fix it.
					</fbt>
				</p>
			</div>

			{devMode && (
				<div className="w-full max-w-md p-4 bg-muted rounded-lg text-left overflow-auto max-h-[300px]">
					<p className="font-mono text-sm font-bold text-destructive mb-2">
						{error.name}: {error.message}
					</p>
					{error.stack && (
						<pre className="font-mono text-xs whitespace-pre-wrap opacity-70">
							{error.stack}
						</pre>
					)}
					{error.digest && (
						<p className="font-mono text-xs mt-2 opacity-50">
							Digest: {error.digest}
						</p>
					)}
				</div>
			)}

			<Button className="gap-2" onClick={() => reset()} variant="default">
				<RefreshCcw className="h-4 w-4" />
				<fbt desc="Try again button">Try again</fbt>
			</Button>
		</div>
	);
}
