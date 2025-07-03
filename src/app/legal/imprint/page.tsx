export default function ImprintPage() {
	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="mb-6 text-3xl font-bold">
				<fbt desc="Title for the Imprint page">Imprint</fbt>
			</h1>

			<section className="mb-8">
				<h2 className="mb-3 text-2xl font-semibold">
					<fbt desc="Heading for the provider information section in Imprint">
						Provider Information
					</fbt>
				</h2>
				<p className="mb-1">
					<fbt desc="Label for provider name in Imprint">Provider:</fbt>
				</p>
				<p>
					<fbt desc="Placeholder for provider name in Imprint">
						Max Mustermann
					</fbt>
				</p>
				<p>
					<fbt desc="Placeholder for provider street address in Imprint">
						Musterstraße 1
					</fbt>
				</p>
				<p>
					<fbt desc="Placeholder for provider city and postal code in Imprint">
						12345 Musterstadt
					</fbt>
				</p>
			</section>

			<section className="mb-8">
				<h2 className="mb-3 text-2xl font-semibold">
					<fbt desc="Heading for contact information section in Imprint">
						Contact
					</fbt>
				</h2>
				<p>
					<fbt desc="Placeholder for contact email in Imprint">
						E-Mail: max.mustermann@example.com
					</fbt>
				</p>
				<p>
					<fbt desc="Placeholder for contact phone number in Imprint (optional)">
						Phone: 01234 / 567890 (optional)
					</fbt>
				</p>
			</section>

			<section className="mb-8">
				<h2 className="mb-3 text-2xl font-semibold">
					<fbt desc="Heading for person responsible for content (e.g., V.i.S.d.P.) in Imprint">
						Responsible for Content
					</fbt>
				</h2>
				<p>
					<fbt desc="Placeholder for name of person responsible for content in Imprint">
						Max Mustermann (Address as above)
					</fbt>
				</p>
			</section>

			<section>
				<h2 className="mb-3 text-2xl font-semibold">
					<fbt desc="Heading for disclaimer section in Imprint">Disclaimer</fbt>
				</h2>
				<p>
					<fbt desc="Placeholder text for disclaimer in Imprint">
						Despite careful content control, we assume no liability for the
						content of external links. The operators of the linked pages are
						solely responsible for their content.
					</fbt>
				</p>
			</section>
		</div>
	);
}
