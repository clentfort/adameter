import type { DiaperChange } from '@/types/diaper';
import type { Event } from '@/types/event';
import type { FeedingSession } from '@/types/feeding';
import type { GrowthMeasurement } from '@/types/growth';
import { useEffect, useState } from 'react';
import { diaperRepository } from '@/data/diaper-repository';
import { eventsRepository } from '@/data/events-repository';
import { feedingRepository } from '@/data/feeding-repository';
import { measurementsRepository } from '@/data/measurements-repository';

export function useAppState() {
	const [sessions, setSessions] = useState<ReadonlyArray<FeedingSession>>([]);
	const [events, setEvents] = useState<ReadonlyArray<Event>>([]);
	const [measurements, setMeasurements] = useState<
		ReadonlyArray<GrowthMeasurement>
	>([]);
	const [diaperChanges, setDiaperChanges] = useState<
		ReadonlyArray<DiaperChange>
	>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		setSessions(feedingRepository.getAll());
		setEvents(eventsRepository.getAll());
		setMeasurements(measurementsRepository.getAll());
		setDiaperChanges(diaperRepository.getAll());
		setIsLoading(false);
	}, []);

	const saveSession = (session: FeedingSession) => {
		feedingRepository.insertAtFront(session);
		setSessions(feedingRepository.getAll());
	};

	const updateSession = (updatedSession: FeedingSession) => {
		feedingRepository.updateById(updatedSession.id, updatedSession);
		setSessions(feedingRepository.getAll());
	};

	const deleteSession = (sessionId: string) => {
		feedingRepository.removeById(sessionId);
		setSessions(feedingRepository.getAll());
	};

	const addEvent = (event: Event) => {
		eventsRepository.insertAtFront(event);
		setEvents(eventsRepository.getAll());
	};

	const updateEvent = (updatedEvent: Event) => {
		eventsRepository.updateById(updatedEvent.id, updatedEvent);
		setEvents(eventsRepository.getAll());
	};

	const deleteEvent = (eventId: string) => {
		eventsRepository.removeById(eventId);
		setEvents(eventsRepository.getAll());
	};

	const addMeasurement = (measurement: GrowthMeasurement) => {
		measurementsRepository.insertAtFront(measurement);
		setMeasurements(measurementsRepository.getAll());
	};

	const updateMeasurement = (updatedMeasurement: GrowthMeasurement) => {
		measurementsRepository.updateById(
			updatedMeasurement.id,
			updatedMeasurement,
		);
		setMeasurements(measurementsRepository.getAll());
	};

	const deleteMeasurement = (measurementId: string) => {
		measurementsRepository.removeById(measurementId);
		setMeasurements(measurementsRepository.getAll());
	};

	const addDiaperChange = (change: DiaperChange) => {
		diaperRepository.insertAtFront(change);
		setDiaperChanges(diaperRepository.getAll());
	};

	const updateDiaperChange = (updatedChange: DiaperChange) => {
		diaperRepository.updateById(updatedChange.id, updatedChange);

		setDiaperChanges(diaperRepository.getAll());
	};

	const deleteDiaperChange = (changeId: string) => {
		diaperRepository.removeById(changeId);
		setDiaperChanges(diaperRepository.getAll());
	};

	return {
		addDiaperChange,
		addEvent,
		addMeasurement,
		deleteDiaperChange,
		deleteEvent,
		deleteMeasurement,
		deleteSession,
		diaperChanges,
		events,
		isLoading,
		measurements,
		saveSession,
		sessions,
		updateDiaperChange,
		updateEvent,
		updateMeasurement,
		updateSession,
	};
}
