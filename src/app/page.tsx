'use client';

import { compareDesc } from 'date-fns';
import { redirect } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import { I18nContext } from '@/contexts/i18n-context';
import { importDataFromUrl } from '@/utils/import-data-from-url';

export default function HomePage() {
	const [shouldRedirect, setShouldRedirect] = useState(false);

	// const diapers = useAtom(diapersAtom);
	// const events = useAtom(eventsAtom);
	// const feedings = useAtom(feedingsAtom);
	// const measurements = useAtom(measurementsAtom);

	// const [, setFeedingInProgress] = useFeedingInProgress();
	const { setLocale } = useContext(I18nContext);

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
			if (hash) {
				try {
					const data = await importDataFromUrl(window.location.href);

					// upsert(data.diaperChanges, diapers);
					// upsert(data.events, events);
					// upsert(data.measurements, measurements);
					// upsert(data.sessions, feedings);
					// setFeedingInProgress(data.feedingInProgress);
					setLocale(data.preferredLanguage);
				} catch (error) {
					console.error('Error importing data:', error);
				}
			}
			enableRedirect();
		})();

		return () => {
			active = false;
		};
	}, [setLocale]);

	if (shouldRedirect) {
		redirect('/feeding');
	}

	return <div>Loading...</div>;
}

// function upsert<T extends { id: string }>(
// 	importedItems: T[],
// 	[currentItems, set]: [T[], (items: T[]) => void],
// ) {
// 	for (const itemToImport of importedItems) {
// 		if (currentItems.some((item) => item.id === itemToImport.id)) {
// 			continue;
// 		}
// 		currentItems.unshift(itemToImport);
// 	}

// 	currentItems.sort((a, b) => {
// 		const aId = new Date(Number.parseInt(a.id));
// 		const bId = new Date(Number.parseInt(b.id));

// 		return compareDesc(aId, bId);
// 	});

// 	set(currentItems);
// }
