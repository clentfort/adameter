import { fbt } from 'fbt';

// TODO: Add Datenschutzerklärung content
export default function DatenschutzerklaerungPage() {
	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">
				<fbt desc="Heading for the Privacy Policy page">
					Datenschutzerklärung
				</fbt>
			</h1>
			<p className="leading-7">
				<fbt desc="Placeholder text for the Privacy Policy page content">
					Placeholder for Datenschutzerklärung content.
				</fbt>
			</p>
		</div>
	);
}
