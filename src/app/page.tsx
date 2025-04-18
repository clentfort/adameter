'use client';

import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import { importDataFromUrl } from '@/utils/import-data-from-url';

export default function HomePagek() {
	const [shouldRedirect, setShouldRedirect] = useState(false);

	useEffect(() => {
		let active = true;

		const enableRedirect = () => {
			if (!active) {
				return;
			}
			setShouldRedirect(true);
		};

		(async () => {
			const hash = window.location.hash;
			if (!hash) {
				enableRedirect();
				return;
			}
			await importDataFromUrl(window.location.href);
			enableRedirect();
		})();

		return () => {
			active = false;
		};
	}, []);

	if (shouldRedirect) {
		redirect('/feeding');
	}
	return null;
}
