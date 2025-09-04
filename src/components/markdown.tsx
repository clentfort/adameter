import ReactMarkdown from 'react-markdown';

interface MarkdownProps {
	children: string;
}

export default function Markdown({ children }: MarkdownProps) {
	return (
		<div className="prose dark:prose-invert">
			<ReactMarkdown>{children}</ReactMarkdown>
		</div>
	);
}
