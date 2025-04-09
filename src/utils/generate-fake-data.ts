import type { FeedingSession } from '@/types/feeding';
import type { Event } from '@/types/event';
import type { GrowthMeasurement } from '@/types/growth';
import type { DiaperChange } from '@/types/diaper';

// Function to generate a random integer between min and max (inclusive)
const randomInt = (min: number, max: number): number => {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Function to generate a random date within a range
const randomDate = (start: Date, end: Date): Date => {
	return new Date(
		start.getTime() + Math.random() * (end.getTime() - start.getTime()),
	);
};

// Function to generate a random breast side
const randomBreast = (): 'left' | 'right' => {
	return Math.random() < 0.5 ? 'left' : 'right';
};

// Function to generate random descriptions with special characters and line breaks
const generateDescription = (
	type: 'event' | 'measurement' | 'diaper',
): string => {
	const specialChars = [
		'ä',
		'ö',
		'ü',
		'ß',
		'€',
		'%',
		'&',
		'#',
		'@',
		'!',
		'?',
		':',
		';',
	];

	const eventDescriptions = [
		`Notizen zum Ereignis:
- Alles verlief gut
- Keine Komplikationen
- Nächster Termin in 2 Wochen`,
		`Wichtige Beobachtungen:
1. Leichte Rötung aufgetreten
2. Temperatur: 37,5°C
3. Weiteres Monitoring nötig`,
		`Arztbesuch bei Dr. Müller
Adresse: Hauptstraße 123
Tel: 0123-456789
E-Mail: dr.mueller@praxis.de`,
		`Symptome & Verlauf:
* Fieber (38,2°C)
* Unruhe beim Stillen
* Bessere Laune am Nachmittag
* Medikament: 2ml Paracetamol-Saft`,
		`Wichtig! Nächste Kontrolle nicht vergessen!
Termin: in 3 Tagen
Mitzubringen: Impfpass & Versichertenkarte`,
	];

	const measurementDescriptions = [
		`Messung nach dem Frühstück
Stimmung: gut gelaunt
Besonderheiten: keine`,
		`Kontrolle beim Kinderarzt Dr. Schmitt
Percentile: 65%
Allgemeinzustand: sehr gut`,
		`Gewichtszunahme verlangsamt sich etwas.
Ernährung überprüfen?
Stilldauer: ø 20 Min. pro Mahlzeit`,
		`Messung zu Hause mit digitaler Waage
Genauigkeit: ±10g
Zeit: vor dem Abendessen`,
		`Größenmessung schwierig, Kind sehr unruhig.
Wert könnte ±0,5cm abweichen.
Wiederholung in 3 Tagen empfohlen!`,
	];

	const diaperDescriptions = [
		`Leichte Rötung am Po
Windelcreme aufgetragen
Nächste Kontrolle in 2 Stunden`,
		`Windel war sehr voll
Längere Wickelpause empfohlen
Haut sieht gut aus`,
		`Stuhlgang etwas fest
Mehr Flüssigkeit anbieten
Ansonsten unauffällig`,
		`Windelausschlag bemerkt
Heilsalbe aufgetragen
Häufigeres Wickeln empfohlen`,
		`Windel hat leicht ausgelaufen
Kleidung gewechselt
Nächste Größe ausprobieren?`,
	];

	// Select a random description based on type
	const descriptions =
		type === 'event'
			? eventDescriptions
			: type === 'measurement'
				? measurementDescriptions
				: diaperDescriptions;

	const baseDescription =
		descriptions[Math.floor(Math.random() * descriptions.length)];

	// Add some random special characters
	let modifiedDescription = baseDescription;
	if (Math.random() > 0.7) {
		const randomSpecialChar =
			specialChars[Math.floor(Math.random() * specialChars.length)];
		modifiedDescription += `

Notiz: ${randomSpecialChar} Wichtige Information! ${randomSpecialChar}`;
	}

	return modifiedDescription;
};

export const generateFakeData = (
	days = 7,
	feedingsPerDay = 12,
): {
	diaperChanges: DiaperChange[];
	events: Event[];
	measurements: GrowthMeasurement[];
	sessions: FeedingSession[];
} => {
	console.log(
		`Generating fake data for ${days} days with ${feedingsPerDay} feedings per day`,
	);

	const sessions: FeedingSession[] = [];
	const events: Event[] = [];
	const measurements: GrowthMeasurement[] = [];
	const diaperChanges: DiaperChange[] = [];

	// Calculate start date (days ago from now)
	const endDate = new Date();
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - days);

	// Generate birth event
	const birthDate = new Date(startDate);
	birthDate.setHours(randomInt(8, 20), randomInt(0, 59), 0, 0);

	events.push({
		color: '#10b981',
		description: generateDescription('event'),
		id: `birth-${Date.now()}`,
		startDate: birthDate.toISOString(),
		title: 'Geburt',
		type: 'point', // Green
	});

	// Generate initial weight and height measurement at birth
	const birthWeight = randomInt(2800, 4200); // in grams
	const birthHeight = randomInt(48, 54); // in cm

	measurements.push({
		date: birthDate.toISOString(),
		height: birthHeight,
		id: `birth-measurement-${Date.now()}`,
		notes: generateDescription('measurement'),
		weight: birthWeight,
	});

	// Generate a random illness event with start and end date
	const illnessStartDate = randomDate(
		new Date(startDate.getTime() + days * 0.3 * 24 * 60 * 60 * 1000), // Start after 30% of the time period
		new Date(startDate.getTime() + days * 0.7 * 24 * 60 * 60 * 1000), // End before 70% of the time period
	);

	const hasEndDate = Math.random() > 0.3; // 70% chance to have an end date
	const illnessEndDate = hasEndDate
		? new Date(
				illnessStartDate.getTime() + randomInt(2, 5) * 24 * 60 * 60 * 1000,
			)
		: undefined;

	events.push({
		color: '#f59e0b',
		description: generateDescription('event'),
		endDate: illnessEndDate?.toISOString(),
		id: `illness-${Date.now()}`,
		startDate: illnessStartDate.toISOString(),
		title: 'Neugeborenengelbsucht',
		type: 'period', // Amber
	});

	// Generate a vaccination event
	const vaccinationDate = randomDate(
		new Date(startDate.getTime() + days * 0.5 * 24 * 60 * 60 * 1000), // After half the time period
		endDate,
	);

	events.push({
		color: '#8b5cf6',
		description: generateDescription('event'),
		id: `vaccination-${Date.now()}`,
		startDate: vaccinationDate.toISOString(),
		title: 'Impfung',
		type: 'point', // Purple
	});

	// Generate a doctor's appointment with start and end time on the same day
	const appointmentDate = randomDate(
		new Date(startDate.getTime() + days * 0.2 * 24 * 60 * 60 * 1000),
		new Date(startDate.getTime() + days * 0.9 * 24 * 60 * 60 * 1000),
	);

	const appointmentEndDate = new Date(appointmentDate);
	appointmentEndDate.setHours(appointmentDate.getHours() + 1); // 1 hour appointment

	events.push({
		color: '#0ea5e9',
		description: generateDescription('event'),
		endDate: appointmentEndDate.toISOString(),
		id: `appointment-${Date.now()}`,
		startDate: appointmentDate.toISOString(),
		title: 'Kinderarzttermin',
		type: 'period', // Sky blue
	});

	// Generate additional measurements (one per week plus some random ones)
	const weekCount = Math.ceil(days / 7);
	let currentWeight = birthWeight;
	let currentHeight = birthHeight;

	// Weekly measurements
	for (let i = 1; i <= weekCount; i++) {
		const measurementDate = new Date(birthDate);
		measurementDate.setDate(measurementDate.getDate() + i * 7);

		// Stop if we've gone past the end date
		if (measurementDate > endDate) break;

		// Weight increases by 150-300g per week
		currentWeight += randomInt(150, 300);

		// Height increases by 0.5-1.5cm per week
		currentHeight += randomInt(5, 15) / 10;

		measurements.push({
			date: measurementDate.toISOString(),
			height: Math.round(currentHeight * 10) / 10,
			id: `measurement-week-${Date.now()}-${i}`,
			// Round to 1 decimal place
notes:
				i === 1
					? generateDescription('measurement')
					: Math.random() > 0.5
						? generateDescription('measurement')
						: undefined, 
			weight: currentWeight,
		});
	}

	// Add some random measurements (just weight or just height)
	const randomMeasurementCount = randomInt(2, 5);
	for (let i = 0; i < randomMeasurementCount; i++) {
		const measurementDate = randomDate(startDate, endDate);

		// Determine if this is weight-only, height-only, or both
		const measurementType = Math.random();

		// Interpolate weight and height based on date
		const daysSinceBirth =
			(measurementDate.getTime() - birthDate.getTime()) / (24 * 60 * 60 * 1000);
		const estimatedWeightGain = (daysSinceBirth / 7) * randomInt(150, 300); // Approx weekly gain
		const estimatedHeightGain = (daysSinceBirth / 7) * (randomInt(5, 15) / 10); // Approx weekly gain

		const estimatedWeight = birthWeight + estimatedWeightGain;
		const estimatedHeight = birthHeight + estimatedHeightGain;

		// Add some random variation
		const weightVariation = estimatedWeight * (randomInt(-3, 3) / 100); // ±3%
		const heightVariation = estimatedHeight * (randomInt(-2, 2) / 100); // ±2%

		measurements.push({
			date: measurementDate.toISOString(),
			height:
				measurementType > 0.3
					? Math.round((estimatedHeight + heightVariation) * 10) / 10
					: undefined,
			id: `measurement-random-${Date.now()}-${i}`,
			notes:
				Math.random() > 0.5 ? generateDescription('measurement') : undefined,
			weight:
				measurementType < 0.7
					? Math.round(estimatedWeight + weightVariation)
					: undefined,
		});
	}

	// Generate diaper changes
	const diapersPerDay = Math.round(feedingsPerDay * 0.8); // Slightly fewer diapers than feedings
	const diaperBrands = ['pampers', 'huggies', 'lillydoo', 'dm', 'rossmann'];

	let currentDate = new Date(startDate);

	// Calculate total number of diapers to generate
	const totalDiapers = days * diapersPerDay;
	console.log(`Attempting to generate ${totalDiapers} diaper changes`);

	let diaperCount = 0;

	while (currentDate < endDate && diaperCount < totalDiapers) {
		// Generate diapers for this day
		const dailyDiapers = randomInt(
			Math.max(1, diapersPerDay - 2),
			diapersPerDay + 2,
		); // Slight variation in daily diapers

		for (let i = 0; i < dailyDiapers && diaperCount < totalDiapers; i++) {
			// Set random hour and minute for this diaper change
			const hour = randomInt(0, 23);
			const minute = randomInt(0, 59);
			currentDate.setHours(hour, minute, 0, 0);

			// Skip if we've gone past the end date
			if (currentDate > endDate) break;

			// Determine if this is a stool diaper (about 30% chance)
			const containsStool = Math.random() < 0.3;

			// Random temperature (only about 20% of changes include temperature)
			const hasTemperature = Math.random() < 0.2;
			const temperature = hasTemperature ? 36.5 + Math.random() * 2 : undefined; // 36.5-38.5°C

			// Random diaper brand (about 80% of changes include brand)
			const hasBrand = Math.random() < 0.8;
			const diaperBrand = hasBrand
				? diaperBrands[randomInt(0, diaperBrands.length - 1)]
				: undefined;

			// Random leakage (about 10% of changes have leakage)
			const hasLeakage = Math.random() < 0.1;

			// Random abnormalities (about 15% of changes have abnormalities)
			const hasAbnormalities = Math.random() < 0.15;
			const abnormalities = hasAbnormalities
				? generateDescription('diaper')
				: undefined;

			// Create diaper change
			const change: DiaperChange = {
				
abnormalities,
				
// Always true
containsStool,
				
containsUrine: true, 
				diaperBrand,
				id: `${currentDate.getTime()}`,
				leakage: hasLeakage,
				temperature,
				timestamp: currentDate.toISOString(),
			};

			diaperChanges.push(change);
			diaperCount++;

			// Move to next diaper time (approximately 2-4 hours later with some randomness)
			const minutesToNext = randomInt(120, 240);
			currentDate = new Date(currentDate.getTime() + minutesToNext * 60 * 1000);
		}

		// Move to next day if we haven't already passed the end date
		if (currentDate < endDate) {
			currentDate.setHours(0, 0, 0, 0);
			currentDate.setDate(currentDate.getDate() + 1);
		}
	}

	// Generate feeding sessions
	currentDate = new Date(startDate);
	let lastBreast: 'left' | 'right' = randomBreast();

	// Calculate total number of feedings to generate
	const totalFeedings = days * feedingsPerDay;
	console.log(`Attempting to generate ${totalFeedings} feeding sessions`);

	let feedingCount = 0;

	while (currentDate < endDate && feedingCount < totalFeedings) {
		// Generate feedings for this day
		const dailyFeedings = randomInt(
			Math.max(1, feedingsPerDay - 2),
			feedingsPerDay + 2,
		); // Slight variation in daily feedings

		for (let i = 0; i < dailyFeedings && feedingCount < totalFeedings; i++) {
			// Set random hour and minute for this feeding
			const hour = randomInt(0, 23);
			const minute = randomInt(0, 59);
			currentDate.setHours(hour, minute, 0, 0);

			// Skip if we've gone past the end date
			if (currentDate > endDate) break;

			// Alternate breasts with some randomness
			lastBreast =
				Math.random() < 0.8
					? lastBreast === 'left'
						? 'right'
						: 'left'
					: lastBreast;

			// Generate random duration (5-65 minutes with average around 20)
			// Using a triangular-like distribution to cluster around the average
			let durationInMinutes;
			const r = Math.random();
			if (r < 0.7) {
				// 70% chance of being close to average
				durationInMinutes = randomInt(15, 25);
			} else if (r < 0.9) {
				// 20% chance of being medium duration
				durationInMinutes = randomInt(10, 35);
			} else {
				// 10% chance of being very short or very long
				durationInMinutes =
					Math.random() < 0.5 ? randomInt(5, 10) : randomInt(35, 65);
			}

			const durationInSeconds = durationInMinutes * 60;

			// Create start and end times
			const startTime = new Date(currentDate);
			const endTime = new Date(startTime.getTime() + durationInSeconds * 1000);

			// Create session
			const session: FeedingSession = {
				breast: lastBreast,
				durationInSeconds,
				endTime: endTime.toISOString(),
				id: `${startTime.getTime()}`,
				startTime: startTime.toISOString(),
			};

			sessions.push(session);
			feedingCount++;

			// Move to next feeding time (approximately 2 hours later with some randomness)
			const minutesToNext = randomInt(90, 150); // 1.5 to 2.5 hours
			currentDate = new Date(endTime.getTime() + minutesToNext * 60 * 1000);
		}

		// Move to next day if we haven't already passed the end date
		if (currentDate < endDate) {
			currentDate.setHours(0, 0, 0, 0);
			currentDate.setDate(currentDate.getDate() + 1);
		}
	}

	console.log(
		`Generated ${sessions.length} feeding sessions, ${events.length} events, ${measurements.length} measurements, and ${diaperChanges.length} diaper changes`,
	);

	// Sort sessions by start time (newest first)
	sessions.sort(
		(a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
	);

	// Sort measurements by date (newest first)
	measurements.sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
	);

	// Sort diaper changes by timestamp (newest first)
	diaperChanges.sort(
		(a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
	);

	return { diaperChanges, events, measurements, sessions };
};
