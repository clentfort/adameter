import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

export interface MarkdownProps {
	children: string;
	className?: string;
}

export default function Markdown({
	children,
	className,
}: MarkdownProps) {
	return (
		<div className={cn('prose dark:prose-invert', className)}>
			<ReactMarkdown>{children}</ReactMarkdown>
		</div>
	);
}
