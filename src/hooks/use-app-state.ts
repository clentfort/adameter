import { DiaperChange } from '@/types/diaper';
import { Event } from '@/types/event';
import { FeedingSession } from '@/types/feeding';
import { GrowthMeasurement } from '@/types/growth';
import { useEffect, useState } from 'react';

export function useAppState() {
	const [sessions, setSessions] = useState<FeedingSession[]>([]);
	const [events, setEvents] = useState<Event[]>([]);
	const [measurements, setMeasurements] = useState<GrowthMeasurement[]>([]);
	const [diaperChanges, setDiaperChanges] = useState<DiaperChange[]>([]);
	const [nextBreast, setNextBreast] = useState<'left' | 'right' | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Load sessions from localStorage on component mount
		try {
			const savedSessions = localStorage.getItem('feedingSessions');
			if (savedSessions) {
				const parsedSessions = JSON.parse(savedSessions);

				// Ensure sessions is an array
				const sessionsArray = Array.isArray(parsedSessions)
					? parsedSessions
					: [];
				setSessions(sessionsArray);

				// Determine next breast based on last session
				if (sessionsArray.length > 0) {
					const lastSession = sessionsArray[0];
					setNextBreast(lastSession.breast === 'left' ? 'right' : 'left');
				}
			}

			// Load events from localStorage
			const savedEvents = localStorage.getItem('feedingEvents');
			if (savedEvents) {
				const parsedEvents = JSON.parse(savedEvents);
				// Ensure events is an array
				const eventsArray = Array.isArray(parsedEvents) ? parsedEvents : [];
				setEvents(eventsArray);
			}

			// Load growth measurements from localStorage
			const savedMeasurements = localStorage.getItem('growthMeasurements');
			if (savedMeasurements) {
				const parsedMeasurements = JSON.parse(savedMeasurements);
				// Ensure measurements is an array
				const measurementsArray = Array.isArray(parsedMeasurements)
					? parsedMeasurements
					: [];
				setMeasurements(measurementsArray);
			}

			// Load diaper changes from localStorage
			const savedDiaperChanges = localStorage.getItem('diaperChanges');
			if (savedDiaperChanges) {
				const parsedDiaperChanges = JSON.parse(savedDiaperChanges);
				// Ensure diaper changes is an array
				const diaperChangesArray = Array.isArray(parsedDiaperChanges)
					? parsedDiaperChanges
					: [];
				setDiaperChanges(diaperChangesArray);
			}
		} catch (error) {
			console.error('Error loading data:', error);
			// Initialize with empty arrays if there's an error
			setSessions([]);
			setEvents([]);
			setMeasurements([]);
			setDiaperChanges([]);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const saveSession = (session: FeedingSession) => {
		const updatedSessions = [session, ...sessions];
		setSessions(updatedSessions);
		try {
			localStorage.setItem('feedingSessions', JSON.stringify(updatedSessions));
		} catch (error) {
			console.error('Error saving session:', error);
		}

		// Update next breast
		setNextBreast(session.breast === 'left' ? 'right' : 'left');
	};

	const updateSession = (updatedSession: FeedingSession) => {
		const updatedSessions = sessions.map((session) =>
			session.id === updatedSession.id ? updatedSession : session,
		);
		setSessions(updatedSessions);
		try {
			localStorage.setItem('feedingSessions', JSON.stringify(updatedSessions));
		} catch (error) {
			console.error('Error updating session:', error);
		}

		// Recalculate next breast if the most recent session was updated
		if (updatedSession.id === sessions[0]?.id) {
			setNextBreast(updatedSession.breast === 'left' ? 'right' : 'left');
		}
	};

	const deleteSession = (sessionId: string) => {
		const updatedSessions = sessions.filter(
			(session) => session.id !== sessionId,
		);
		setSessions(updatedSessions);
		try {
			localStorage.setItem('feedingSessions', JSON.stringify(updatedSessions));
		} catch (error) {
			console.error('Error deleting session:', error);
		}

		// Recalculate next breast if the most recent session was deleted
		if (sessionId === sessions[0]?.id && updatedSessions.length > 0) {
			setNextBreast(updatedSessions[0].breast === 'left' ? 'right' : 'left');
		} else if (updatedSessions.length === 0) {
			setNextBreast(null);
		}
	};

	const addEvent = (event: Event) => {
		const updatedEvents = [event, ...events];
		setEvents(updatedEvents);
		try {
			localStorage.setItem('feedingEvents', JSON.stringify(updatedEvents));
		} catch (error) {
			console.error('Error adding event:', error);
		}
	};

	const updateEvent = (updatedEvent: Event) => {
		const updatedEvents = events.map((event) =>
			event.id === updatedEvent.id ? updatedEvent : event,
		);
		setEvents(updatedEvents);
		try {
			localStorage.setItem('feedingEvents', JSON.stringify(updatedEvents));
		} catch (error) {
			console.error('Error updating event:', error);
		}
	};

	const deleteEvent = (eventId: string) => {
		const updatedEvents = events.filter((event) => event.id !== eventId);
		setEvents(updatedEvents);
		try {
			localStorage.setItem('feedingEvents', JSON.stringify(updatedEvents));
		} catch (error) {
			console.error('Error deleting event:', error);
		}
	};

	const addMeasurement = (measurement: GrowthMeasurement) => {
		const updatedMeasurements = [measurement, ...measurements];
		setMeasurements(updatedMeasurements);
		try {
			localStorage.setItem(
				'growthMeasurements',
				JSON.stringify(updatedMeasurements),
			);
		} catch (error) {
			console.error('Error adding measurement:', error);
		}
	};

	const updateMeasurement = (updatedMeasurement: GrowthMeasurement) => {
		const updatedMeasurements = measurements.map((measurement) =>
			measurement.id === updatedMeasurement.id
				? updatedMeasurement
				: measurement,
		);
		setMeasurements(updatedMeasurements);
		try {
			localStorage.setItem(
				'growthMeasurements',
				JSON.stringify(updatedMeasurements),
			);
		} catch (error) {
			console.error('Error updating measurement:', error);
		}
	};

	const deleteMeasurement = (measurementId: string) => {
		const updatedMeasurements = measurements.filter(
			(measurement) => measurement.id !== measurementId,
		);
		setMeasurements(updatedMeasurements);
		try {
			localStorage.setItem(
				'growthMeasurements',
				JSON.stringify(updatedMeasurements),
			);
		} catch (error) {
			console.error('Error deleting measurement:', error);
		}
	};

	const addDiaperChange = (change: DiaperChange) => {
		const updatedChanges = [change, ...diaperChanges];
		setDiaperChanges(updatedChanges);
		try {
			localStorage.setItem('diaperChanges', JSON.stringify(updatedChanges));
		} catch (error) {
			console.error('Error adding diaper change:', error);
		}
	};

	const updateDiaperChange = (updatedChange: DiaperChange) => {
		const updatedChanges = diaperChanges.map((change) =>
			change.id === updatedChange.id ? updatedChange : change,
		);
		setDiaperChanges(updatedChanges);
		try {
			localStorage.setItem('diaperChanges', JSON.stringify(updatedChanges));
		} catch (error) {
			console.error('Error updating diaper change:', error);
		}
	};

	const deleteDiaperChange = (changeId: string) => {
		const updatedChanges = diaperChanges.filter(
			(change) => change.id !== changeId,
		);
		setDiaperChanges(updatedChanges);
		try {
			localStorage.setItem('diaperChanges', JSON.stringify(updatedChanges));
		} catch (error) {
			console.error('Error deleting diaper change:', error);
		}
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
		nextBreast,
		saveSession,
		sessions,
		updateDiaperChange,
		updateEvent,
		updateMeasurement,
		updateSession,
	};
}
