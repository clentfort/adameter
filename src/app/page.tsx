'use client';

import type { DiaperChange } from '@/types/diaper';
import type { Event } from '@/types/event';
import type { FeedingSession } from '@/types/feeding';
import type { GrowthMeasurement } from '@/types/growth';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import { diaperRepository } from '@/data/diaper-repository';
import { eventsRepository } from '@/data/events-repository';
import { feedingRepository } from '@/data/feeding-repository';
import { measurementsRepository } from '@/data/measurements-repository';

export default function HomePagek() {
	const [shouldRedirect, setShouldRedirect] = useState(false);

	useEffect(() => {
		const hash = window.location.hash;
		if (!hash) {
			setShouldRedirect(true);
			return;
		}

		const params = new URLSearchParams(hash.slice(1));
		const data = params.get('data');

		if (!data) {
			setShouldRedirect(true);
			return;
		}

		const decodedData: {
			diaperChanges: DiaperChange[];
			events: Event[];
			measurements: GrowthMeasurement[];
			sessions: FeedingSession[];
		} = JSON.parse(decodeURIComponent(atob(data)));

		const { diaperChanges, events, measurements, sessions } = decodedData;
		diaperChanges.forEach((diaperChange) => {
			if (!diaperRepository.getById(diaperChange.id)) {
				diaperRepository.insertAtFront(diaperChange);
			}
		});
		diaperRepository.restoreSortingOrder();

		events.forEach((event) => {
			if (!eventsRepository.getById(event.id)) {
				eventsRepository.insertAtFront(event);
			}
		});
		eventsRepository.restoreSortingOrder();

		measurements.forEach((measurement) => {
			if (!measurementsRepository.getById(measurement.id)) {
				measurementsRepository.insertAtFront(measurement);
			}
		});
		measurementsRepository.restoreSortingOrder();

		sessions.forEach((session) => {
			if (!feedingRepository.getById(session.id)) {
				feedingRepository.insertAtFront(session);
			}
		});
		feedingRepository.restoreSortingOrder();

		setShouldRedirect(true);
	}, []);

	if (shouldRedirect) {
		redirect('/feeding');
	}
	return null;
}
