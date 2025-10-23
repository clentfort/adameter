import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

export interface MarkdownProps {
	className?: string;
	children: string;
}

export default function Markdown({
	children,
	className,
}: MarkdownProps) {
	return (
		<ReactMarkdown
			className={cn('prose dark:prose-invert', className)}
		>
			{children}
		</ReactMarkdown>
	);
}
