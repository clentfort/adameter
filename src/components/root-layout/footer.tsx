import { Github, Heart } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
	return (
		<footer className="mt-auto border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
			<div className="container mx-auto px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
				<div className="mb-2">
					<Link
						className="hover:underline"
						href="/legal/imprint"
						prefetch={false}
					>
						<fbt desc="Link text for Imprint page in footer">Imprint</fbt>
					</Link>
					<span className="mx-2">|</span>
					<Link
						className="hover:underline"
						href="/legal/privacy-policy"
						prefetch={false}
					>
						<fbt desc="Link text for Privacy Policy page in footer">
							Privacy Policy
						</fbt>
					</Link>
				</div>
				<div className="mb-2">
					<fbt desc="Footer message: Made with love in Germany. {heartIcon} is a placeholder for a heart icon.">
						Made with <fbt:param name="heartIcon_footer_v2"><Heart className="inline-block h-4 w-4 text-red-500" /></fbt:param> in Germany
					</fbt>
				</div>
				<div>
					<a
						className="inline-flex items-center hover:underline"
						href="https://github.com/clentfort/adameter"
						rel="noopener noreferrer"
						target="_blank"
					>
						<Github className="mr-1 h-5 w-5" />
						<fbt desc="Link text for GitHub repository in footer">GitHub</fbt>
					</a>
				</div>
			</div>
		</footer>
	);
}
