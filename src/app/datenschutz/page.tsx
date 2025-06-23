// For <fbt> tags, no explicit import of 'fbt' itself is typically needed in the file
// if Babel plugin is configured.

export default function DatenschutzPage() {
	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="mb-6 text-3xl font-bold">
				<fbt desc="Title for the Data Protection page">
					Datenschutzerklärung
				</fbt>
			</h1>

			<section className="mb-6">
				<h2 className="mb-2 text-2xl font-semibold">
					<fbt desc="Heading for Introduction section in Data Protection page">
						Einleitung
					</fbt>
				</h2>
				<p>
					<fbt desc="Introduction text for Data Protection page">
						Wir freuen uns über Ihr Interesse an unserer App. Der Schutz Ihrer
						Privatsphäre ist für uns sehr wichtig. Nachstehend informieren wir
						Sie ausführlich über den Umgang mit Ihren Daten.
					</fbt>
				</p>
			</section>

			<section className="mb-6">
				<h2 className="mb-2 text-2xl font-semibold">
					<fbt desc="Heading for Data Collection section in Data Protection page">
						Erhebung und Verarbeitung von Daten
					</fbt>
				</h2>
				<p>
					<fbt desc="Text for Data Collection section in Data Protection page">
						Unsere App erhebt und speichert standardmäßig keine
						personenbezogenen Daten, es sei denn, Sie geben diese freiwillig im
						Rahmen der Nutzung bestimmter Funktionen ein (z.B. bei der
						Erstellung eines Kontos oder der Eingabe von Aktivitätsdaten).
						Diese Daten werden ausschließlich zur Bereitstellung der
						App-Funktionalitäten verwendet.
					</fbt>
				</p>
			</section>

			<section className="mb-6">
				<h2 className="mb-2 text-2xl font-semibold">
					<fbt desc="Heading for Data Sharing section in Data Protection page">
						Weitergabe von Daten an Dritte
					</fbt>
				</h2>
				<p>
					<fbt desc="Text for Data Sharing section in Data Protection page">
						Eine Weitergabe Ihrer personenbezogenen Daten an Dritte findet nicht
						statt, es sei denn, wir sind gesetzlich dazu verpflichtet oder Sie
						haben uns zuvor Ihre ausdrückliche Einwilligung erteilt.
					</fbt>
				</p>
			</section>

			<section className="mb-6">
				<h2 className="mb-2 text-2xl font-semibold">
					<fbt desc="Heading for Cookies/Similar Technologies section in Data Protection page">
						Einsatz von Cookies oder ähnlichen Technologien
					</fbt>
				</h2>
				<p>
					<fbt desc="Text for Cookies/Similar Technologies section in Data Protection page">
						Unsere App verwendet möglicherweise lokale Speichertechnologien
						(ähnlich Cookies), um Präferenzen oder den Zustand der Anwendung zu
						speichern. Diese dienen ausschließlich der Funktionalität der App und
						werden nicht für Tracking-Zwecke verwendet.
					</fbt>
				</p>
			</section>

			<section className="mb-6">
				<h2 className="mb-2 text-2xl font-semibold">
					<fbt desc="Heading for Your Rights section in Data Protection page">
						Ihre Rechte
					</fbt>
				</h2>
				<p>
					<fbt desc="Text for Your Rights section in Data Protection page">
						Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Ihre
						gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger
						und den Zweck der Datenverarbeitung sowie ein Recht auf
						Berichtigung, Sperrung oder Löschung dieser Daten. Hierzu sowie zu
						weiteren Fragen zum Thema personenbezogene Daten können Sie sich
						jederzeit unter der im Impressum angegebenen Adresse an uns wenden.
					</fbt>
				</p>
			</section>

			<section className="mb-6">
				<h2 className="mb-2 text-2xl font-semibold">
					<fbt desc="Heading for Changes to Privacy Policy section in Data Protection page">
						Änderung dieser Datenschutzerklärung
					</fbt>
				</h2>
				<p>
					<fbt desc="Text for Changes to Privacy Policy section in Data Protection page">
						Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit
						sie stets den aktuellen rechtlichen Anforderungen entspricht oder um
						Änderungen unserer Leistungen in der Datenschutzerklärung
						umzusetzen, z. B. bei der Einführung neuer Funktionen. Für Ihren
						erneuten Besuch gilt dann die neue Datenschutzerklärung.
					</fbt>
				</p>
			</section>

			<section>
				<h2 className="mb-2 text-2xl font-semibold">
					<fbt desc="Heading for Contact for Privacy Questions section in Data Protection page">
						Kontakt für Datenschutzfragen
					</fbt>
				</h2>
				<p>
					<fbt desc="Text for Contact for Privacy Questions section in Data Protection page">
						Wenn Sie Fragen zum Datenschutz haben, schreiben Sie uns bitte eine
						E-Mail oder wenden Sie sich direkt an die im Impressum genannte
						verantwortliche Person.
					</fbt>
				</p>
			</section>
		</div>
	);
}
