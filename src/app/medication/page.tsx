'use client';

import { Pill, PlusCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMedicationAdministrations } from '@/hooks/use-medication-administrations';
import { useMedicationRegimens } from '@/hooks/use-medication-regimens';
import { checkMissedDoses } from '@/utils/medication/check-missed-doses';
import ActiveRegimens from './components/active-regimens';
import AdministrationHistory from './components/administration-history';
import MedicationAdministrationForm from './components/medication-administration-form';
import MedicationRegimenForm from './components/medication-regimen-form';
import PastRegimens from './components/past-regimens';
import ReminderBanner from './components/reminder-banner';

export default function MedicationPage() {
	const [isAddRegimenDialogOpen, setIsAddRegimenDialogOpen] = useState(false);
	const [isAddEntryDialogOpen, setIsAddEntryDialogOpen] = useState(false);

	const { add: addRegimen, value: regimens } = useMedicationRegimens();
	const { add: addAdministration, value: administrations } =
		useMedicationAdministrations();

	useEffect(() => {
		const newSkips = checkMissedDoses(regimens, administrations);
		if (newSkips.length > 0) {
			newSkips.forEach((skip) => addAdministration(skip));
		}
	}, [regimens, administrations, addAdministration]);

	const activeRegimens = regimens.filter((r) => r.status === 'active');
	const pastRegimens = regimens.filter((r) => r.status === 'finished');

	const overdueCount = activeRegimens.filter((regimen) => {
		const regimenAdmins = administrations
			.filter((a) => a.regimenId === regimen.id)
			.sort(
				(a, b) =>
					new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
			);
		const lastAction = regimenAdmins[0];
		const lastActionTime = lastAction
			? new Date(lastAction.timestamp)
			: new Date(regimen.startDate);

		if (regimen.type === 'interval' && regimen.intervalHours) {
			const nextDue = new Date(
				lastActionTime.getTime() + regimen.intervalHours * 60 * 60 * 1000,
			);
			return nextDue < new Date();
		} else if (regimen.type === 'fixed' && regimen.times) {
			const today = new Date();
			const scheduledTimes = regimen.times.map((t) => {
				const [hours, minutes] = t.split(':').map(Number);
				const date = new Date(today);
				date.setHours(hours, minutes, 0, 0);
				return date;
			});
			return scheduledTimes.some((t) => t > lastActionTime && t < new Date());
		}
		return false;
	}).length;

	return (
		<div className="w-full space-y-8">
			<ReminderBanner overdueCount={overdueCount} />
			<section>
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold flex items-center gap-2">
						<Pill className="h-5 w-5" />
						<fbt desc="Title for active medication regimens">Active Regimens</fbt>
					</h2>
					<Button onClick={() => setIsAddRegimenDialogOpen(true)} size="sm">
						<PlusCircle className="h-4 w-4 mr-1" />
						<fbt desc="Button to start a new medication course">New Regimen</fbt>
					</Button>
				</div>
				<ActiveRegimens regimens={activeRegimens} />
			</section>

			{pastRegimens.length > 0 && (
				<section>
					<PastRegimens regimens={pastRegimens} />
				</section>
			)}

			<section>
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold">
						<fbt desc="Title for medication administration history">History</fbt>
					</h2>
					<Button
						onClick={() => setIsAddEntryDialogOpen(true)}
						size="sm"
						variant="outline"
					>
						<PlusCircle className="h-4 w-4 mr-1" />
						<fbt common>Add Entry</fbt>
					</Button>
				</div>
				<AdministrationHistory />
			</section>

			{isAddRegimenDialogOpen && (
				<MedicationRegimenForm
					onClose={() => setIsAddRegimenDialogOpen(false)}
					onSave={(regimen) => {
						addRegimen(regimen);
						setIsAddRegimenDialogOpen(false);
					}}
				/>
			)}

			{isAddEntryDialogOpen && (
				<MedicationAdministrationForm
					onClose={() => setIsAddEntryDialogOpen(false)}
					onSave={(admin) => {
						addAdministration(admin);
						setIsAddEntryDialogOpen(false);
					}}
				/>
			)}
		</div>
	);
}
