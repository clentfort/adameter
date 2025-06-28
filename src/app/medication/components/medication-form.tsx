'use client';

import { fbt } from 'fbtee';
import { Save } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Medication } from '@/types/medication';
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';
import { dateToTimeInputValue } from '@/utils/date-to-time-input-value';
import '@/i18n'; // Required for fbt

interface MedicationFormProps {
	medication?: Medication;
	onClose: () => void;
	onSave: (data: Medication) => void;
	title: React.ReactNode;
}

export default function MedicationForm({
	medication,
	onClose,
	onSave,
	title,
}: MedicationFormProps) {
	// Initialize state directly, similar to EventForm
	const [name, setName] = useState(medication ? medication.name : '');
	const [dosage, setDosage] = useState(medication ? medication.dosage : '');
	const [startDate, setStartDate] = useState(
		dateToDateInputValue(
			medication ? new Date(medication.startDate) : new Date(),
		),
	);
	const [isOngoing, setIsOngoing] = useState(
		medication ? medication.endDate === null : true,
	);
	const [endDate, setEndDate] = useState(
		dateToDateInputValue(
			medication && medication.endDate
				? new Date(medication.endDate)
				: new Date(),
		),
	);
	const [prescriberType, setPrescriberType] = useState<
		Medication['prescriberType']
	>(medication ? medication.prescriberType : 'self');
	const [prescriberName, setPrescriberName] = useState(
		medication ? medication.prescriberName || '' : '',
	);
	const [timeOfDay, setTimeOfDay] = useState(
		medication && medication.timeOfDay
			? dateToTimeInputValue(new Date(`1970-01-01T${medication.timeOfDay}:00`))
			: '',
	);
	const [notificationsEnabled, setNotificationsEnabled] = useState(
		medication ? (medication.notificationsEnabled ?? true) : true,
	);
	const [notes, setNotes] = useState(medication ? medication.notes || '' : '');
	const [error, setError] = useState('');

	// useEffect to update form if 'medication' prop changes after initial mount
	// This is important if the same form instance is kept open and the prop changes (e.g. selecting a different item to edit without closing/reopening)
	// REMOVED as per user feedback: Caller is responsible for unmount/remount or key change.
	// useEffect(() => {
	// 	if (medication) {
	// 		setName(medication.name);
	// 		setDosage(medication.dosage);
	// 		setStartDate(dateToDateInputValue(new Date(medication.startDate)));
	// 		setIsOngoing(medication.endDate === null);
	// 		setEndDate(
	// 			dateToDateInputValue(
	// 				medication.endDate ? new Date(medication.endDate) : new Date(),
	// 			),
	// 		);
	// 		setPrescriberType(medication.prescriberType);
	// 		setPrescriberName(medication.prescriberName || '');
	// 		setTimeOfDay(
	// 			medication.timeOfDay
	// 				? dateToTimeInputValue(
	// 						new Date(`1970-01-01T${medication.timeOfDay}:00`),
	// 					)
	// 				: '',
	// 		);
	// 		setNotificationsEnabled(medication.notificationsEnabled ?? true);
	// 		setNotes(medication.notes || '');
	// 	}
	// }, [medication]);

	const handleSave = () => {
		setError(''); // Clear previous errors

		if (!name.trim()) {
			setError(
				fbt(
					'Medication name is required.',
					'Validation error message for medication form',
				),
			);
			return;
		}
		if (!dosage.trim()) {
			setError(
				fbt(
					'Dosage is required.',
					'Validation error message for medication form',
				),
			);
			return;
		}
		if (!startDate) {
			// Date input should always have a value, but good to check
			setError(
				fbt(
					'Start date is required.',
					'Validation error message for medication form',
				),
			);
			return;
		}
		if (!isOngoing && !endDate) {
			setError(
				fbt(
					'End date is required if medication is not ongoing.',
					'Validation error message for medication form',
				),
			);
			return;
		}
		if (
			(prescriberType === 'doctor' || prescriberType === 'other') &&
			!prescriberName.trim()
		) {
			setError(
				fbt(
					'Prescriber name is required for Doctor or Other.',
					'Validation error message for medication form',
				),
			);
			return;
		}

		const newMedicationEntry: Medication = {
			dosage: dosage.trim(),
			endDate: isOngoing ? null : new Date(endDate).toISOString(),
			id: medication?.id || crypto.randomUUID(),
			name: name.trim(),
			notes: notes.trim() || undefined,
			notificationsEnabled,
			prescriberName:
				prescriberType === 'doctor' || prescriberType === 'other'
					? prescriberName.trim()
					: undefined,
			prescriberType,
			startDate: new Date(startDate).toISOString(),
			timeOfDay: timeOfDay || undefined,
		};
		onSave(newMedicationEntry);
		// Schedule notification
		if (
			newMedicationEntry.notificationsEnabled &&
			newMedicationEntry.timeOfDay &&
			newMedicationEntry.startDate
		) {
			const [hours, minutes] = newMedicationEntry.timeOfDay.split(':').map(Number);
			const notificationTime = new Date(newMedicationEntry.startDate);
			notificationTime.setHours(hours, minutes, 0, 0);

			const now = new Date();
			const timeDifference = notificationTime.getTime() - now.getTime();

			if (timeDifference > 0) {
				// Fallback: Local setTimeout notification
				setTimeout(() => {
					if (Notification.permission === 'granted') {
						new Notification(`Medication Reminder: ${newMedicationEntry.name}`, {
							body: `It's time for your medication: ${newMedicationEntry.dosage}.`,
							icon: '/icon-192x192.png',
						});
					}
				}, timeDifference);

				// PWA Push Notification (simulated client-side)
				if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
					navigator.serviceWorker.ready.then((registration) => {
						// Check if the registration has the showNotification method
						if (typeof registration.showNotification === 'function') {
							registration.showNotification(
								`Medication: ${newMedicationEntry.name}`,
								{
									body: `Time for ${newMedicationEntry.dosage}. Notes: ${newMedicationEntry.notes || ''}`,
									icon: '/icon-192x192.png',
									tag: `medication-${newMedicationEntry.id}`, // Tag to prevent duplicate notifications if needed
									// timestamp: notificationTime.getTime(), // Show original scheduled time
									// renotify: true, // Vibrate/sound again if replacing an existing notification with the same tag
									// requireInteraction: true, // Keep notification visible until user interaction
									data: {
										url: `/medication?id=${newMedicationEntry.id}`, // URL to open when notification is clicked
									},
								},
							);
						} else {
							console.warn(
								'registration.showNotification is not available. Scheduling with setTimeout instead.',
							);
						}
					}).catch(error => {
						console.error("Service worker not ready or error showing notification:", error);
						// Fallback already handled by setTimeout above
					});
				} else {
					console.warn("Service worker not available for push notification. Fallback to setTimeout.");
				}
			} else {
				console.log("Scheduled time is in the past. No notification will be set.");
			}
		}

		onClose();
	};

	return (
		<Dialog onOpenChange={onClose} open>
			<DialogContent className="sm:max-w-[480px]">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid grid-cols-4 items-center gap-4">
						<Label className="text-right" htmlFor="name">
							<fbt desc="Label for medication name input">Name</fbt>
						</Label>
						<div className="col-span-3">
							<Input
								id="name"
								onChange={(e) => setName(e.target.value)}
								value={name}
							/>
						</div>
					</div>

					<div className="grid grid-cols-4 items-center gap-4">
						<Label className="text-right" htmlFor="dosage">
							<fbt desc="Label for medication dosage input">Dosage</fbt>
						</Label>
						<div className="col-span-3">
							<Input
								id="dosage"
								onChange={(e) => setDosage(e.target.value)}
								value={dosage}
							/>
						</div>
					</div>

					<div className="grid grid-cols-4 items-center gap-4">
						<Label className="text-right" htmlFor="startDate">
							<fbt desc="Label for medication start date input">Start Date</fbt>
						</Label>
						<div className="col-span-3">
							<Input
								id="startDate"
								onChange={(e) => setStartDate(e.target.value)}
								type="date"
								value={startDate}
							/>
						</div>
					</div>

					<div className="grid grid-cols-4 items-center gap-4">
						<Label className="text-right" htmlFor="endDate">
							<fbt desc="Label for medication end date input">End Date</fbt>
						</Label>
						<div className="col-span-2">
							<Input
								className={isOngoing ? 'disabled:opacity-50' : ''}
								disabled={isOngoing}
								id="endDate"
								onChange={(e) => setEndDate(e.target.value)}
								type="date"
								value={endDate}
							/>
						</div>
						<div className="col-span-1 flex items-center space-x-2 justify-self-end pr-2">
							<Switch
								checked={isOngoing}
								id="isOngoing"
								onCheckedChange={setIsOngoing}
							/>
							<Label className="text-sm whitespace-nowrap" htmlFor="isOngoing">
								<fbt desc="Label for ongoing medication switch">Ongoing</fbt>
							</Label>
						</div>
					</div>

					<div className="grid grid-cols-4 items-center gap-4">
						<Label className="text-right">
							<fbt desc="Label for prescriber type selection">Prescriber</fbt>
						</Label>
						<RadioGroup
							className="col-span-3 flex flex-wrap gap-x-4 gap-y-2"
							onValueChange={(value: Medication['prescriberType']) =>
								setPrescriberType(value)
							}
							value={prescriberType}
						>
							<div className="flex items-center space-x-2">
								<RadioGroupItem id="prescriberSelf" value="self" />
								<Label className="font-normal" htmlFor="prescriberSelf">
									<fbt desc="Option for self-prescribed medication">Self</fbt>
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem id="prescriberDoctor" value="doctor" />
								<Label className="font-normal" htmlFor="prescriberDoctor">
									<fbt desc="Option for doctor-prescribed medication">
										Doctor
									</fbt>
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem id="prescriberOther" value="other" />
								<Label className="font-normal" htmlFor="prescriberOther">
									<fbt desc="Option for other prescriber of medication">
										Other
									</fbt>
								</Label>
							</div>
						</RadioGroup>
					</div>

					{(prescriberType === 'doctor' || prescriberType === 'other') && (
						<div className="grid grid-cols-4 items-center gap-4">
							<Label className="text-right" htmlFor="prescriberName">
								<fbt desc="Label for prescriber name input">
									Prescriber Name
								</fbt>
							</Label>
							<div className="col-span-3">
								<Input
									id="prescriberName"
									onChange={(e) => setPrescriberName(e.target.value)}
									value={prescriberName}
								/>
							</div>
						</div>
					)}

					<div className="grid grid-cols-4 items-center gap-4">
						<Label className="text-right" htmlFor="timeOfDay">
							<fbt desc="Label for time of day for medication">
								Time <span className="text-xs text-gray-500">(Optional)</span>
							</fbt>
						</Label>
						<div className="col-span-3">
							<Input
								id="timeOfDay"
								onChange={(e) => setTimeOfDay(e.target.value)}
								type="time"
								value={timeOfDay}
							/>
						</div>
					</div>

					<div className="grid grid-cols-4 items-center gap-4">
						<Label className="text-right" htmlFor="notificationsEnabled">
							<fbt desc="Label for enabling medication reminders">
								Enable Reminders
							</fbt>
						</Label>
						<div className="col-span-3">
							<Switch
								checked={notificationsEnabled}
								id="notificationsEnabled"
								onCheckedChange={setNotificationsEnabled}
							/>
						</div>
					</div>

					<div className="grid grid-cols-4 items-center gap-4">
						<Label className="text-right" htmlFor="notes">
							<fbt desc="Label for medication notes input">
								Notes <span className="text-xs text-gray-500">(Optional)</span>
							</fbt>
						</Label>
						<div className="col-span-3">
							<Textarea
								id="notes"
								onChange={(e) => setNotes(e.target.value)}
								value={notes}
							/>
						</div>
					</div>

					{error && (
						<div className="col-span-4 text-sm text-red-500 text-center py-2">
							{error}
						</div>
					)}

					<DialogFooter>
						<Button onClick={onClose} type="button" variant="outline">
							<fbt common>Cancel</fbt>
						</Button>
						<Button onClick={handleSave} type="button">
							<Save className="mr-2 h-4 w-4" />
							<fbt common>Save</fbt>
						</Button>
					</DialogFooter>
				</div>
			</DialogContent>
		</Dialog>
	);
}
