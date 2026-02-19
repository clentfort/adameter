'use client';

import type {
	MedicationAdministration,
	MedicationRegimen,
} from '@/types/medication';
import { Check, Edit2, MoreVertical, StopCircle, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMedicationAdministrations } from '@/hooks/use-medication-administrations';
import { useMedicationRegimens } from '@/hooks/use-medication-regimens';
import { getDeviceId } from '@/utils/device-id';
import MedicationRegimenForm from './medication-regimen-form';

export default function ActiveRegimens({
	regimens,
}: {
	regimens: MedicationRegimen[];
}) {
	const { update: updateRegimen } = useMedicationRegimens();
	const { add: addAdmin, value: administrations } =
		useMedicationAdministrations();
	const [editingRegimen, setEditingRegimen] =
		useState<MedicationRegimen | null>(null);

	const regimenStatus = useMemo(() => {
		const now = new Date();
		return regimens.map((regimen) => {
			const regimenAdmins = administrations
				.filter((a) => a.regimenId === regimen.id)
				.sort(
					(a, b) =>
						new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
				);

			const lastAdmin = regimenAdmins[0];

			let nextDue: Date | null = null;
			let status: 'upcoming' | 'due' | 'overdue' = 'upcoming';

			if (regimen.type === 'interval' && regimen.intervalHours) {
				nextDue = !lastAdmin
					? new Date(regimen.startDate)
					: new Date(
							new Date(lastAdmin.timestamp).getTime() +
								regimen.intervalHours * 60 * 60 * 1000,
						);
			} else if (regimen.type === 'fixed' && regimen.times) {
				// Find the next scheduled time
				const today = new Date();
				const scheduledTimes = regimen.times
					.map((t) => {
						const [hours, minutes] = t.split(':').map(Number);
						const date = new Date(today);
						date.setHours(hours, minutes, 0, 0);
						return date;
					})
					.sort((a, b) => a.getTime() - b.getTime());

				// If we have a last admin/skip today, find the next one after that
				const lastRelevantAction = lastAdmin; // Simplification: just last admin
				const lastTime = lastRelevantAction
					? new Date(lastRelevantAction.timestamp)
					: new Date(regimen.startDate);

				nextDue = scheduledTimes.find((t) => t > lastTime) || null;

				if (!nextDue) {
					// Next one is tomorrow
					const tomorrow = new Date(today);
					tomorrow.setDate(tomorrow.getDate() + 1);
					const firstTime = regimen.times[0];
					const [hours, minutes] = firstTime.split(':').map(Number);
					nextDue = new Date(tomorrow);
					nextDue.setHours(hours, minutes, 0, 0);
				}
			}

			if (nextDue) {
				const diffMinutes = (nextDue.getTime() - now.getTime()) / (1000 * 60);
				status =
					diffMinutes < 0 ? 'overdue' : diffMinutes < 60 ? 'due' : 'upcoming';
			}

			return { lastAdmin, nextDue, regimen, status };
		});
	}, [regimens, administrations]);

	const handleLogDose = (regimen: MedicationRegimen) => {
		const newAdmin: MedicationAdministration = {
			deviceId: getDeviceId(),
			dosage: regimen.dosage,
			id: crypto.randomUUID(),
			name: regimen.name,
			prescribedBy: regimen.prescribedBy,
			regimenId: regimen.id,
			status: 'administered',
			timestamp: new Date().toISOString(),
			unit: regimen.unit,
		};
		addAdmin(newAdmin);
	};

	const handleSkipDose = (regimen: MedicationRegimen) => {
		const newAdmin: MedicationAdministration = {
			deviceId: getDeviceId(),
			dosage: regimen.dosage,
			id: crypto.randomUUID(),
			name: regimen.name,
			prescribedBy: regimen.prescribedBy,
			regimenId: regimen.id,
			status: 'skipped',
			timestamp: new Date().toISOString(),
			unit: regimen.unit,
		};
		addAdmin(newAdmin);
	};

	if (regimens.length === 0) {
		return (
			<div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
				<fbt desc="Message when no active medication regimens are found">
					No active regimens.
				</fbt>
			</div>
		);
	}

	return (
		<div className="grid gap-4 sm:grid-cols-2">
			{regimenStatus.map(({ lastAdmin, nextDue, regimen, status }) => (
				<Card key={regimen.id}>
					<CardHeader className="pb-2">
						<div className="flex items-start justify-between gap-2">
							<div className="flex items-center gap-1 min-w-0">
								<CardTitle className="truncate">{regimen.name}</CardTitle>
								<DropdownMenu>
									<DropdownMenuTrigger
										render={<Button size="icon" variant="ghost" />}
									>
										<MoreVertical className="h-4 w-4" />
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										<DropdownMenuItem
											onClick={() => setEditingRegimen(regimen)}
										>
											<Edit2 className="h-4 w-4 mr-2" />
											<fbt common>Edit</fbt>
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() =>
												updateRegimen({ ...regimen, status: 'finished' })
											}
										>
											<StopCircle className="h-4 w-4 mr-2" />
											<fbt desc="Action to finish/stop a medication regimen">
												Finish
											</fbt>
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
							<div className="flex flex-col items-end shrink-0">
								<span
									className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
										status === 'overdue'
											? 'bg-red-100 text-red-700'
											: status === 'due'
												? 'bg-yellow-100 text-yellow-700'
												: 'bg-green-100 text-green-700'
									}`}
								>
									{status === 'overdue' ? (
										<fbt desc="Overdue status for medication">Overdue</fbt>
									) : status === 'due' ? (
										<fbt desc="Due soon status for medication">Due Soon</fbt>
									) : (
										<fbt desc="Upcoming status for medication">Upcoming</fbt>
									)}
								</span>
								{nextDue && (
									<span className="text-[10px] text-muted-foreground mt-1 text-right whitespace-nowrap">
										<fbt desc="Label for next dose time">Next:</fbt>{' '}
										{nextDue.toLocaleTimeString([], {
											hour: '2-digit',
											minute: '2-digit',
										})}
									</span>
								)}
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							{regimen.dosage} {regimen.unit} •{' '}
							{regimen.type === 'fixed' ? (
								<fbt desc="Description of fixed times regimen">
									<fbt:param name="count">{regimen.times?.length}</fbt:param>{' '}
									times daily
								</fbt>
							) : (
								<fbt desc="Description of interval regimen">
									Every{' '}
									<fbt:param name="hours">{regimen.intervalHours}</fbt:param>{' '}
									hours
								</fbt>
							)}
						</p>
						{lastAdmin && (
							<p className="text-[10px] text-muted-foreground mt-1">
								<fbt desc="Last administered time">Last:</fbt>{' '}
								{new Date(lastAdmin.timestamp).toLocaleString([], {
									dateStyle: 'short',
									timeStyle: 'short',
								})}
							</p>
						)}
						<div className="mt-4 flex gap-2">
							<Button className="flex-1" onClick={() => handleLogDose(regimen)}>
								<Check className="h-4 w-4 mr-2" />
								<fbt common>Log Dose</fbt>
							</Button>
							{regimen.type === 'fixed' && (
								<Button
									onClick={() => handleSkipDose(regimen)}
									size="icon"
									variant="outline"
								>
									<X className="h-4 w-4" />
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			))}

			{editingRegimen && (
				<MedicationRegimenForm
					onClose={() => setEditingRegimen(null)}
					onSave={(updated) => {
						updateRegimen(updated);
						setEditingRegimen(null);
					}}
					regimen={editingRegimen}
				/>
			)}
		</div>
	);
}
