import { Heart } from 'lucide-react';
import Link from 'next/link';
// For <fbt> tags, no explicit import of 'fbt' itself is typically needed in the file
// if Babel plugin is configured.

export function Footer() {
	return (
		<footer className="mt-auto border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
			<div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:gap-0">
				<div className="flex flex-col items-center gap-2 text-sm text-gray-500 dark:text-gray-400 sm:flex-row sm:gap-4">
					<Link className="hover:underline" href="/impressum" prefetch={false}>
						<fbt desc="Link text for Impressum page in footer">
							Impressum
						</fbt>
					</Link>
					<Link
						className="hover:underline"
						href="/datenschutz"
						prefetch={false}
					>
						<fbt desc="Link text for Data Protection page in footer">
							Datenschutzerklärung
						</fbt>
					</Link>
					<a
						className="hover:underline"
						href="https://github.com/clentfort/adameter"
						rel="noopener noreferrer"
						target="_blank"
					>
						<fbt desc="Link text for GitHub repository in footer">GitHub</fbt>
					</a>
				</div>
				<div className="text-sm text-gray-500 dark:text-gray-400">
					<fbt desc="Footer message: Made with love in Germany. {heartIcon} is a placeholder for a heart icon.">
						Made with <fbt:param name="heartIcon_black"><Heart className="inline-block h-4 w-4 text-red-500" /></fbt:param> in Germany
					</fbt>
				</div>
			</div>
		</footer>
	);
}
