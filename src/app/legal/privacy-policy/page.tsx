// For <fbt> tags, no explicit import of 'fbt' itself is typically needed in the file
// if Babel plugin is configured.

export default function PrivacyPolicyPage() {
	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="mb-6 text-3xl font-bold">
				<fbt desc="Title for the Privacy Policy page">Privacy Policy</fbt>
			</h1>

			<section className="mb-6">
				<h2 className="mb-2 text-2xl font-semibold">
					<fbt desc="Heading for Introduction section in Privacy Policy page">
						Introduction
					</fbt>
				</h2>
				<p>
					<fbt desc="Introduction text for Privacy Policy page">
						We are pleased about your interest in our app. The protection of
						your privacy is very important to us. Below we inform you in detail
						about the handling of your data.
					</fbt>
				</p>
			</section>

			<section className="mb-6">
				<h2 className="mb-2 text-2xl font-semibold">
					<fbt desc="Heading for Data Collection section in Privacy Policy page">
						Data Collection and Processing
					</fbt>
				</h2>
				<p>
					<fbt desc="Text for Data Collection section in Privacy Policy page">
						Our app does not collect or store any personal data by default,
						unless you voluntarily enter it when using certain functions (e.g.,
						when creating an account or entering activity data). This data is
						used exclusively to provide the app functionalities.
					</fbt>
				</p>
			</section>

			<section className="mb-6">
				<h2 className="mb-2 text-2xl font-semibold">
					<fbt desc="Heading for Data Sharing section in Privacy Policy page">
						Disclosure of Data to Third Parties
					</fbt>
				</h2>
				<p>
					<fbt desc="Text for Data Sharing section in Privacy Policy page">
						Your personal data will not be passed on to third parties unless we
						are legally obliged to do so or you have given us your express
						prior consent.
					</fbt>
				</p>
			</section>

			<section className="mb-6">
				<h2 className="mb-2 text-2xl font-semibold">
					<fbt desc="Heading for Cookies/Similar Technologies section in Privacy Policy page">
						Use of Cookies or Similar Technologies
					</fbt>
				</h2>
				<p>
					<fbt desc="Text for Cookies/Similar Technologies section in Privacy Policy page">
						Our app may use local storage technologies (similar to cookies) to
						store preferences or the state of the application. These are used
						exclusively for the functionality of the app and are not used for
						tracking purposes.
					</fbt>
				</p>
			</section>

			<section className="mb-6">
				<h2 className="mb-2 text-2xl font-semibold">
					<fbt desc="Heading for Your Rights section in Privacy Policy page">
						Your Rights
					</fbt>
				</h2>
				<p>
					<fbt desc="Text for Your Rights section in Privacy Policy page">
						You have the right to free information about your stored personal
						data, its origin and recipients, and the purpose of data
						processing, as well as a right to correction, blocking, or
						deletion of this data at any time. For this purpose, as well as
						for further questions on the subject of personal data, you can
						contact us at any time at the address given in the imprint.
					</fbt>
				</p>
			</section>

			<section className="mb-6">
				<h2 className="mb-2 text-2xl font-semibold">
					<fbt desc="Heading for Changes to Privacy Policy section in Privacy Policy page">
						Changes to this Privacy Policy
					</fbt>
				</h2>
				<p>
					<fbt desc="Text for Changes to Privacy Policy section in Privacy Policy page">
						We reserve the right to adapt this privacy policy so that it always
						complies with current legal requirements or to implement changes to
						our services in the privacy policy, e.g., when introducing new
						functions. The new privacy policy will then apply to your next
						visit.
					</fbt>
				</p>
			</section>

			<section>
				<h2 className="mb-2 text-2xl font-semibold">
					<fbt desc="Heading for Contact for Privacy Questions section in Privacy Policy page">
						Contact for Privacy Questions
					</fbt>
				</h2>
				<p>
					<fbt desc="Text for Contact for Privacy Questions section in Privacy Policy page">
						If you have any questions about data protection, please send us an
						e-mail or contact the person responsible named in the imprint
						directly.
					</fbt>
				</p>
			</section>
		</div>
	);
}
