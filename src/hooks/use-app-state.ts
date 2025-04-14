import { useEffect, useState } from 'react';
import { diaperRepository } from '@/data/diaper-repository';
import { eventsRepository } from '@/data/events-repository';
import { feedingRepository } from '@/data/feeding-repository';
import { measurementsRepository } from '@/data/measurements-repository';
import { DiaperChange } from '@/types/diaper';
import { Event } from '@/types/event';
import { FeedingSession } from '@/types/feeding';
import { GrowthMeasurement } from '@/types/growth';

export function useAppState() {
	const [sessions, setSessions] = useState<readonly FeedingSession[]>([]);
	const [events, setEvents] = useState<readonly Event[]>([]);
	const [measurements, setMeasurements] = useState<
		readonly GrowthMeasurement[]
	>([]);
	const [diaperChanges, setDiaperChanges] = useState<readonly DiaperChange[]>(
		[],
	);
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
