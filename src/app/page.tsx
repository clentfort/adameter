'use client';

import { useState, useEffect } from 'react';
import BreastfeedingTracker from '@/components/breastfeeding-tracker';
import HistoryList from '@/components/history-list';
import AddHistoricSession from '@/components/add-historic-session';
import StatisticsView from '@/components/statistics-view';
import EventsView from '@/components/events-view';
import DiaperView from '@/components/diaper-view';
import GrowthView from '@/components/growth-view';
import TimeSinceLastFeeding from '@/components/time-since-last-feeding';
import TimeSinceLastDiaper from '@/components/time-since-last-diaper';
import LanguageSwitcher from '@/components/language-switcher';
import { useTranslate } from '@/utils/translate';
import type { FeedingSession } from '@/types/feeding';
import type { Event } from '@/types/event';
import type { GrowthMeasurement } from '@/types/growth';
import type { DiaperChange } from '@/types/diaper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Home() {
	const t = useTranslate();
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

	const importData = (
		importedSessions: FeedingSession[],
		importedEvents: Event[] = [],
		importedMeasurements: GrowthMeasurement[] = [],
		importedDiaperChanges: DiaperChange[] = [],
	) => {
		console.log('Importing data:', {
			diaperChanges: importedDiaperChanges,
			events: importedEvents,
			measurements: importedMeasurements,
			sessions: importedSessions,
		});

		// Ensure imported data is arrays
		const sessionsArray = Array.isArray(importedSessions)
			? importedSessions
			: [];
		const eventsArray = Array.isArray(importedEvents) ? importedEvents : [];
		const measurementsArray = Array.isArray(importedMeasurements)
			? importedMeasurements
			: [];
		const diaperChangesArray = Array.isArray(importedDiaperChanges)
			? importedDiaperChanges
			: [];

		// Import sessions
		setSessions(sessionsArray);
		try {
			localStorage.setItem('feedingSessions', JSON.stringify(sessionsArray));
		} catch (error) {
			console.error('Error importing sessions:', error);
		}

		// Import events
		setEvents(eventsArray);
		try {
			localStorage.setItem('feedingEvents', JSON.stringify(eventsArray));
		} catch (error) {
			console.error('Error importing events:', error);
		}

		// Import growth measurements
		setMeasurements(measurementsArray);
		try {
			localStorage.setItem(
				'growthMeasurements',
				JSON.stringify(measurementsArray),
			);
		} catch (error) {
			console.error('Error importing measurements:', error);
		}

		// Import diaper changes
		setDiaperChanges(diaperChangesArray);
		try {
			localStorage.setItem('diaperChanges', JSON.stringify(diaperChangesArray));
		} catch (error) {
			console.error('Error importing diaper changes:', error);
		}

		// Determine next breast based on last session
		if (sessionsArray.length > 0) {
			const lastSession = sessionsArray[0];
			setNextBreast(lastSession.breast === 'left' ? 'right' : 'left');
		} else {
			setNextBreast(null);
		}
	};

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p>{t('loading')}</p>
			</div>
		);
	}

	return (
		<main className="flex min-h-screen flex-col items-center p-4 max-w-md mx-auto">
			<div className="w-full flex justify-between items-center mb-6 mt-4">
				<h1 className="text-2xl font-bold">{t('appTitle')}</h1>
				<LanguageSwitcher />
			</div>

			{/* Display time indicators side by side */}
			<div className="w-full flex flex-row justify-between gap-2 mb-6">
				<TimeSinceLastFeeding lastSession={sessions[0] || null} />
				<TimeSinceLastDiaper lastChange={diaperChanges[0] || null} />
			</div>

			<Tabs className="w-full" defaultValue="feeding">
				<TabsList className="grid grid-cols-5 mb-6">
					<TabsTrigger
						className="flex flex-col xs:flex-row items-center xs:gap-1 px-1 sm:px-2 py-2 text-xs sm:text-sm"
						value="feeding"
					>
						<span className="h-4 w-4">🍼</span>
						<span className="hidden xs:inline">{t('feedingTab')}</span>
					</TabsTrigger>
					<TabsTrigger
						className="flex flex-col xs:flex-row items-center xs:gap-1 px-1 sm:px-2 py-2 text-xs sm:text-sm"
						value="diaper"
					>
						<span className="h-4 w-4">👶</span>
						<span className="hidden xs:inline">{t('diaperTab')}</span>
					</TabsTrigger>
					<TabsTrigger
						className="flex flex-col xs:flex-row items-center xs:gap-1 px-1 sm:px-2 py-2 text-xs sm:text-sm"
						value="growth"
					>
						<span className="h-4 w-4">📏</span>
						<span className="hidden xs:inline">{t('growthTab')}</span>
					</TabsTrigger>
					<TabsTrigger
						className="flex flex-col xs:flex-row items-center xs:gap-1 px-1 sm:px-2 py-2 text-xs sm:text-sm"
						value="events"
					>
						<span className="h-4 w-4">📅</span>
						<span className="hidden xs:inline">{t('eventsTab')}</span>
					</TabsTrigger>
					<TabsTrigger
						className="flex flex-col xs:flex-row items-center xs:gap-1 px-1 sm:px-2 py-2 text-xs sm:text-sm"
						value="statistics"
					>
						<span className="h-4 w-4">📊</span>
						<span className="hidden xs:inline">{t('statisticsTab')}</span>
					</TabsTrigger>
				</TabsList>

				<TabsContent className="w-full" value="feeding">
					<BreastfeedingTracker
						nextBreast={nextBreast}
						onSessionComplete={saveSession}
					/>

					<div className="w-full mt-8">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-xl font-semibold">{t('history')}</h2>
							<AddHistoricSession onSessionAdd={saveSession} />
						</div>
						<HistoryList
							onSessionDelete={deleteSession}
							onSessionUpdate={updateSession}
							sessions={sessions}
						/>
					</div>
				</TabsContent>

				<TabsContent className="w-full" value="diaper">
					<DiaperView
						diaperChanges={diaperChanges}
						onDiaperAdd={addDiaperChange}
						onDiaperDelete={deleteDiaperChange}
						onDiaperUpdate={updateDiaperChange}
					/>
				</TabsContent>

				<TabsContent className="w-full" value="growth">
					<GrowthView
						events={events}
						measurements={measurements}
						onMeasurementAdd={addMeasurement}
						onMeasurementDelete={deleteMeasurement}
						onMeasurementUpdate={updateMeasurement}
					/>
				</TabsContent>

				<TabsContent className="w-full" value="events">
					<EventsView
						events={events}
						onEventAdd={addEvent}
						onEventDelete={deleteEvent}
						onEventUpdate={updateEvent}
					/>
				</TabsContent>

				<TabsContent className="w-full" value="statistics">
					<StatisticsView
						diaperChanges={diaperChanges}
						events={events}
						measurements={measurements}
						sessions={sessions}
					/>
				</TabsContent>
			</Tabs>
		</main>
	);
}
