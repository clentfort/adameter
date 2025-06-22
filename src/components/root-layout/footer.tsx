import Link from 'next/link';
import { fbt } from 'fbt';

export default function Footer() {
	const currentYear = new Date().getFullYear();
	return (
		<footer className="border-t py-8 text-center">
			<div className="container mx-auto px-4">
				<p className="text-sm text-muted-foreground">
					<fbt desc="Copyright notice in the footer">
						© <fbt:param name="current year">{currentYear}</fbt:param> Your
						Company Name. All rights reserved.
					</fbt>
				</p>
				<div className="mt-4 text-sm">
					<Link
						href="/impressum"
						className="text-muted-foreground hover:underline"
					>
						<fbt desc="Link to the Impressum page in the footer">
							Impressum
						</fbt>
					</Link>
					<span className="mx-2 text-muted-foreground">|</span>
					<Link
						href="/datenschutzerklaerung"
						className="text-muted-foreground hover:underline"
					>
						<fbt desc="Link to the Privacy Policy page in the footer">
							Datenschutzerklärung
						</fbt>
					</Link>
				</div>
			</div>
		</footer>
	);
}
