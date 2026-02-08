import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

export interface MarkdownProps {
	children: string;
	className?: string;
}

export default function Markdown({ children, className }: MarkdownProps) {
	return (
		<div className={cn('prose dark:prose-invert', className)}>
			<ReactMarkdown>{children}</ReactMarkdown>
		</div>
	);
}
