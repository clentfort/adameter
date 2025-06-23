// For <fbt> tags, no explicit import of 'fbt' itself is typically needed in the file
// if Babel plugin is configured.

export default function ImpressumPage() {
	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="mb-6 text-3xl font-bold">
				<fbt desc="Title for the Impressum page">Impressum</fbt>
			</h1>

			<section className="mb-8">
				<h2 className="mb-3 text-2xl font-semibold">
					<fbt desc="Heading for the provider information section in Impressum">
						Anbieter
					</fbt>
				</h2>
				<p className="mb-1">
					<fbt desc="Label for provider name in Impressum">Anbieter:</fbt>
				</p>
				<p>
					<fbt desc="Placeholder for provider name in Impressum">
						Max Mustermann
					</fbt>
				</p>
				<p>
					<fbt desc="Placeholder for provider street address in Impressum">
						Musterstraße 1
					</fbt>
				</p>
				<p>
					<fbt desc="Placeholder for provider city and postal code in Impressum">
						12345 Musterstadt
					</fbt>
				</p>
			</section>

			<section className="mb-8">
				<h2 className="mb-3 text-2xl font-semibold">
					<fbt desc="Heading for contact information section in Impressum">
						Kontakt
					</fbt>
				</h2>
				<p>
					<fbt desc="Placeholder for contact email in Impressum">
						E-Mail: max.mustermann@example.com
					</fbt>
				</p>
				<p>
					<fbt desc="Placeholder for contact phone number in Impressum (optional)">
						Telefon: 01234 / 567890 (optional)
					</fbt>
				</p>
			</section>

			<section className="mb-8">
				<h2 className="mb-3 text-2xl font-semibold">
					<fbt desc="Heading for person responsible for content (V.i.S.d.P.) in Impressum">
						Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
					</fbt>
				</h2>
				<p>
					<fbt desc="Placeholder for name of person responsible for content in Impressum">
						Max Mustermann (Anschrift wie oben)
					</fbt>
				</p>
			</section>

			<section>
				<h2 className="mb-3 text-2xl font-semibold">
					<fbt desc="Heading for disclaimer section in Impressum">
						Haftungsausschluss
					</fbt>
				</h2>
				<p>
					<fbt desc="Placeholder text for disclaimer in Impressum">
						Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine
						Haftung für die Inhalte externer Links. Für den Inhalt der
						verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.
					</fbt>
				</p>
			</section>
		</div>
	);
}
