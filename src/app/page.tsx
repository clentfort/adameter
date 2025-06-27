'use client';

import { redirect } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import { SplashScreen } from '@/components/splash-screen';
import { I18nContext } from '@/contexts/i18n-context';
import { useDiaperChanges } from '@/hooks/use-diaper-changes';
import { useEvents } from '@/hooks/use-events';
import { useFeedingSessions } from '@/hooks/use-feeding-sessions';
import { useFeedingInProgress } from '@/hooks/use-feeing-in-progress';
import { useGrowthMeasurements } from '@/hooks/use-growth-measurements';
import {
	loadDataFromLocalStorage,
	loadDataFromUrl,
} from '@/utils/load-data-from-legacy-storage';

export default function HomePage() {
	const [shouldRedirect, setShouldRedirect] = useState(false);
	const { replace: diaperChangesReplace } = useDiaperChanges();
	const { replace: eventsReplace } = useEvents();
	const { replace: feedingSessionsReplace } = useFeedingSessions();
	const [, setFeedingInProgress] = useFeedingInProgress();
	const { replace: growthMeasurementsReplace } = useGrowthMeasurements();

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
			let data: ReturnType<typeof loadDataFromLocalStorage> | undefined;
			if (hash) {
				try {
					data = await loadDataFromUrl(window.location.href);
				} catch (error) {
					console.error('Error importing data:', error);
				}
			} else if (
				localStorage.length > 0 &&
				[
					'diaperChanges',
					'events',
					'feedingSessions',
					'growthMeasurements',
					'activeBreast',
					'startTime',
				].some((key) => key in localStorage) &&
				localStorage.getItem('importedVersionFromLocalStorage') == null
			) {
				data = loadDataFromLocalStorage();
				localStorage.setItem('importedVersionFromLocalStorage', '2025-05-06');
			}

			if (data) {
				diaperChangesReplace(data.diaperChanges);
				eventsReplace(data.events);
				growthMeasurementsReplace(data.measurements);
				feedingSessionsReplace(data.sessions);
				setFeedingInProgress(data.feedingInProgress ?? null);
				setLocale(data.preferredLanguage);
			}
			enableRedirect();
		})();

		return () => {
			active = false;
		};
	}, [
		diaperChangesReplace,
		eventsReplace,
		feedingSessionsReplace,
		growthMeasurementsReplace,
		setFeedingInProgress,
		setLocale,
	]);

	if (shouldRedirect) {
		redirect('/feeding');
	}

	return <SplashScreen />;
}
