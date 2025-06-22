import { fbt } from 'fbt';

// TODO: Add Impressum content
export default function ImpressumPage() {
	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">
				<fbt desc="Heading for the Impressum page">Impressum</fbt>
			</h1>
			<p className="leading-7">
				<fbt desc="Placeholder text for the Impressum page content">
					Placeholder for Impressum content.
				</fbt>
			</p>
		</div>
	);
}
