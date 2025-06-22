import Link from 'next/link';

export default function Footer() {
	return (
		<footer className="border-t py-8 text-center">
			<div className="container mx-auto px-4">
				<p className="text-sm text-muted-foreground">
					© {new Date().getFullYear()} Your Company Name. All rights reserved.
				</p>
				<div className="mt-4 text-sm">
					<Link
						href="/impressum"
						className="text-muted-foreground hover:underline"
					>
						Impressum
					</Link>
					<span className="mx-2 text-muted-foreground">|</span>
					<Link
						href="/datenschutzerklaerung"
						className="text-muted-foreground hover:underline"
					>
						Datenschutzerklärung
					</Link>
				</div>
			</div>
		</footer>
	);
}
