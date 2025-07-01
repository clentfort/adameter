'use client';

import { ChevronDown, ChevronUp, Edit, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import HistoryListInternal from '@/components/history-list';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from '@/components/ui/card';
import { useMedicationRegimens } from '@/hooks/use-medication-regimens';
import { useMedications } from '@/hooks/use-medications';
import { MedicationRegimen } from '@/types/medication-regimen';
import '@/i18n';

// Helper function to format date strings
const formatDate = (dateString?: string) => {
	if (!dateString) return 'N/A';
	return new Date(dateString).toLocaleDateString(undefined, {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});
};

// Helper function to format schedule
const formatSchedule = (schedule: MedicationRegimen['schedule']) => {
	switch (schedule.type) {
		case 'daily':
			return `Daily at ${schedule.times.join(', ')}`;
		case 'interval':
			return `Every ${schedule.intervalValue} ${schedule.intervalUnit}, first dose at ${schedule.firstDoseTime}`;
		case 'weekly':
			return `Weekly on ${schedule.daysOfWeek.join(', ')} at ${schedule.times.join(', ')}`;
		case 'asNeeded':
			return `As needed: ${schedule.details}`;
		default:
			return 'N/A';
	}
};

// Helper function to calculate next due date/time
const calculateNextDue = (regimen: MedicationRegimen): string => {
	// Placeholder logic:
	// This needs to be implemented based on regimen.schedule
	// For now, returns a static string or a simple calculation if possible
	// Example: if schedule is daily at a specific time, calculate next occurrence of that time
	if (regimen.schedule.type === 'daily' && regimen.schedule.times.length > 0) {
		const now = new Date();
		const todayDateStr = now.toISOString().split('T')[0];
		let nextDueTimeStr = '';

		// Find the next time today
		for (const time of regimen.schedule.times.sort()) {
			const [hours, minutes] = time.split(':').map(Number);
			const potentialNextDue = new Date(todayDateStr);
			potentialNextDue.setHours(hours, minutes, 0, 0);
			if (potentialNextDue > now) {
				nextDueTimeStr = potentialNextDue.toLocaleString(undefined, {
					day: 'numeric',
					hour: '2-digit',
					minute: '2-digit',
					month: 'long',
					year: 'numeric',
				});
				break;
			}
		}

		// If all times today have passed, find the first time tomorrow
		if (!nextDueTimeStr) {
			const tomorrow = new Date(now);
			tomorrow.setDate(now.getDate() + 1);
			const tomorrowDateStr = tomorrow.toISOString().split('T')[0];
			const firstTimeTomorrow = regimen.schedule.times.sort()[0];
			const [hours, minutes] = firstTimeTomorrow.split(':').map(Number);
			const nextDueTomorrow = new Date(tomorrowDateStr);
			nextDueTomorrow.setHours(hours, minutes, 0, 0);
			nextDueTimeStr = nextDueTomorrow.toLocaleString(undefined, {
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				month: 'long',
				year: 'numeric',
			});
		}
		return nextDueTimeStr;
	}
	// Fallback for other schedule types or if calculation is complex
	return 'Calculation pending';
};

// Placeholder functions for edit/delete actions
const handleEditRegimen = (regimenId: string) => {
	/* Placeholder for actual edit logic */
};
const handleDeleteRegimen = (regimenId: string) => {
	/* Placeholder for actual delete logic */
};
const handleEditAdministration = (adminId: string) => {
	/* Placeholder for actual edit logic */
};
const handleDeleteAdministration = (adminId: string) => {
	/* Placeholder for actual delete logic */
};

export default function MedicationPage() {
	const {
		remove: removeRegimen,
		update: updateRegimen,
		value: medicationRegimens,
	} = useMedicationRegimens();
	const {
		remove: removeMedication,
		update: updateMedication,
		value: medications,
	} = useMedications();
	const [expandedRegimens, setExpandedRegimens] = useState<
		Record<string, boolean>
	>({});

	const toggleRegimenExpansion = (regimenId: string) => {
		setExpandedRegimens((prev) => ({ ...prev, [regimenId]: !prev[regimenId] }));
	};

	const { activeRegimens, pastRegimens } = useMemo(() => {
		const now = new Date().toISOString();
		// Ensure medicationRegimens is an array before calling reduce (it should be by hook design)
		return (medicationRegimens || []).reduce(
			(acc, regimen) => {
				const isActive =
					!regimen.isDiscontinued &&
					(!regimen.endDate || regimen.endDate > now);
				if (isActive) {
					acc.activeRegimens.push(regimen);
				} else {
					acc.pastRegimens.push(regimen);
				}
				return acc;
			},
			{
				activeRegimens: [] as MedicationRegimen[],
				pastRegimens: [] as MedicationRegimen[],
			},
		);
	}, [medicationRegimens]);

	const medicationsByDate = useMemo(() => {
		const grouped: Record<string, Medication[]> = {}; // Use Medication[] type directly
		// Ensure medications is an array before spreading and sorting (it should be by hook design)
		[...(medications || [])]
			.sort(
				(a, b) =>
					new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
			)
			.forEach((med) => {
				const date = new Date(med.timestamp).toLocaleDateString();
				if (!grouped[date]) {
					grouped[date] = [];
				}
				grouped[date].push(med);
			});
		return grouped;
	}, [medications]);

	const getRegimenNameById = (regimenId: string) => {
		// Ensure medicationRegimens is an array before calling find
		const regimen = (medicationRegimens || []).find((r) => r.id === regimenId);
		return regimen ? regimen.name : 'Unknown Medication';
	};

	return (
		<div className="w-full">
			<h1 className="text-2xl font-semibold mb-6">
				<fbt desc="Main heading for the Medications page">Medications</fbt>
			</h1>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-4">
					<fbt desc="Section heading for Medication Regimens Summary">
						Your Regimens
					</fbt>
				</h2>
				<Accordion
					className="w-full"
					defaultValue={['active-regimens']}
					type="multiple"
				>
					<AccordionItem value="active-regimens">
						<AccordionTrigger>
							<fbt desc="Accordion title for current medication regimens">
								Current
							</fbt>{' '}
							({activeRegimens.length})
						</AccordionTrigger>
						<AccordionContent>
							<div className="space-y-4">
								{activeRegimens.length > 0 ? (
									activeRegimens.map((regimen) => (
										<Card className="py-4 gap-3" key={regimen.id}>
											<CardHeader className="pb-3 px-4">
												<div className="flex justify-between items-start">
													<div>
														<h3 className="text-lg font-semibold">
															{regimen.name}
														</h3>
														<p className="text-sm text-muted-foreground">
															<fbt desc="Label for dosage">Dosage:</fbt>{' '}
															{regimen.dosageAmount} {regimen.dosageUnit}
														</p>
													</div>
													<div className="flex gap-1">
														<Button
															onClick={() => handleEditRegimen(regimen.id)}
															size="icon"
															variant="ghost"
														>
															<Edit className="h-4 w-4" />
															<span className="sr-only">
																<fbt desc="Edit regimen button label">Edit</fbt>
															</span>
														</Button>
														<Button
															onClick={() => handleDeleteRegimen(regimen.id)}
															size="icon"
															variant="ghost"
														>
															<Trash2 className="h-4 w-4" />
															<span className="sr-only">
																<fbt desc="Delete regimen button label">
																	Delete
																</fbt>
															</span>
														</Button>
													</div>
												</div>
											</CardHeader>
											<CardContent className="pb-3 px-4">
												<p className="text-sm font-medium">
													<fbt desc="Label for next due time">Next Due:</fbt>{' '}
													{calculateNextDue(regimen)}
												</p>
												{expandedRegimens[regimen.id] && (
													<div className="mt-3 space-y-1 text-sm">
														<p>
															<strong>
																<fbt desc="Label for schedule">Schedule:</fbt>
															</strong>{' '}
															{formatSchedule(regimen.schedule)}
														</p>
														<p>
															<strong>
																<fbt desc="Label for start date">
																	Start Date:
																</fbt>
															</strong>{' '}
															{formatDate(regimen.startDate)}
														</p>
														{regimen.endDate && (
															<p>
																<strong>
																	<fbt desc="Label for end date">End Date:</fbt>
																</strong>{' '}
																{formatDate(regimen.endDate)}
															</p>
														)}
														<p>
															<strong>
																<fbt desc="Label for prescriber">
																	Prescriber:
																</fbt>
															</strong>{' '}
															{regimen.prescriber}{' '}
															{regimen.prescriberName &&
																`(${regimen.prescriberName})`}
														</p>
														{regimen.notes && (
															<p>
																<strong>
																	<fbt desc="Label for notes">Notes:</fbt>
																</strong>{' '}
																{regimen.notes}
															</p>
														)}
													</div>
												)}
											</CardContent>
											<CardFooter className="pt-0 px-4">
												<Button
													className="text-xs p-0 h-auto"
													onClick={() => toggleRegimenExpansion(regimen.id)}
													size="sm"
													variant="link"
												>
													{expandedRegimens[regimen.id] ? (
														<>
															<ChevronUp className="h-3 w-3 mr-1" />
															<fbt desc="Button to collapse regimen details">
																Show Less
															</fbt>
														</>
													) : (
														<>
															<ChevronDown className="h-3 w-3 mr-1" />
															<fbt desc="Button to expand regimen details">
																Show More
															</fbt>
														</>
													)}
												</Button>
											</CardFooter>
										</Card>
									))
								) : (
									<p>
										<fbt desc="Message when there are no active regimens">
											No active regimens.
										</fbt>
									</p>
								)}
							</div>
						</AccordionContent>
					</AccordionItem>
					<AccordionItem value="past-regimens">
						<AccordionTrigger>
							<fbt desc="Accordion title for archived medication regimens">
								Archived
							</fbt>{' '}
							({pastRegimens.length})
						</AccordionTrigger>
						<AccordionContent>
							<div className="space-y-4">
								{pastRegimens.length > 0 ? (
									pastRegimens.map((regimen) => (
										<Card className="py-4 gap-3" key={regimen.id}>
											<CardHeader className="pb-3 px-4">
												<div className="flex justify-between items-start">
													<div>
														<h3 className="text-lg font-semibold">
															{regimen.name}
														</h3>
														<p className="text-sm text-muted-foreground">
															<fbt desc="Label for dosage">Dosage:</fbt>{' '}
															{regimen.dosageAmount} {regimen.dosageUnit}
														</p>
													</div>
													<div className="flex gap-1">
														<Button
															onClick={() => handleEditRegimen(regimen.id)}
															size="icon"
															variant="ghost"
														>
															<Edit className="h-4 w-4" />
															<span className="sr-only">
																<fbt desc="Edit regimen button label">Edit</fbt>
															</span>
														</Button>
														<Button
															onClick={() => handleDeleteRegimen(regimen.id)}
															size="icon"
															variant="ghost"
														>
															<Trash2 className="h-4 w-4" />
															<span className="sr-only">
																<fbt desc="Delete regimen button label">
																	Delete
																</fbt>
															</span>
														</Button>
													</div>
												</div>
											</CardHeader>
											<CardContent className="pb-3 px-4">
												<p className="text-sm">
													<strong>
														<fbt desc="Label for start date">Start Date:</fbt>
													</strong>{' '}
													{formatDate(regimen.startDate)}
												</p>
												{regimen.endDate && (
													<p className="text-sm">
														<strong>
															<fbt desc="Label for end date">End Date:</fbt>
														</strong>{' '}
														{formatDate(regimen.endDate)}
													</p>
												)}
												{regimen.isDiscontinued && (
													<p className="text-sm text-red-600 font-semibold">
														<fbt desc="Indicator that a regimen is discontinued">
															Discontinued
														</fbt>
													</p>
												)}
												{expandedRegimens[regimen.id] && (
													<div className="mt-3 space-y-1 text-sm">
														<p>
															<strong>
																<fbt desc="Label for schedule">Schedule:</fbt>
															</strong>{' '}
															{formatSchedule(regimen.schedule)}
														</p>
														<p>
															<strong>
																<fbt desc="Label for prescriber">
																	Prescriber:
																</fbt>
															</strong>{' '}
															{regimen.prescriber}{' '}
															{regimen.prescriberName &&
																`(${regimen.prescriberName})`}
														</p>
														{regimen.notes && (
															<p>
																<strong>
																	<fbt desc="Label for notes">Notes:</fbt>
																</strong>{' '}
																{regimen.notes}
															</p>
														)}
													</div>
												)}
											</CardContent>
											<CardFooter className="pt-0 px-4">
												<Button
													className="text-xs p-0 h-auto"
													onClick={() => toggleRegimenExpansion(regimen.id)}
													size="sm"
													variant="link"
												>
													{expandedRegimens[regimen.id] ? (
														<>
															<ChevronUp className="h-3 w-3 mr-1" />
															<fbt desc="Button to collapse regimen details">
																Show Less
															</fbt>
														</>
													) : (
														<>
															<ChevronDown className="h-3 w-3 mr-1" />
															<fbt desc="Button to expand regimen details">
																Show More
															</fbt>
														</>
													)}
												</Button>
											</CardFooter>
										</Card>
									))
								) : (
									<p>
										<fbt desc="Message when there are no past regimens">
											No past or discontinued regimens.
										</fbt>
									</p>
								)}
							</div>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</section>

			<section>
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold">
						<fbt desc="Section heading for Medication Administrations History">
							Medication Administrations History
						</fbt>
					</h2>
				</div>
				{Object.keys(medicationsByDate).length > 0 ? (
					Object.entries(medicationsByDate).map(([date, meds]) => (
						<div className="mb-4" key={date}>
							<h3 className="text-lg font-medium mb-2">{date}</h3>
							<HistoryListInternal
								dateAccessor={(med) => med.timestamp}
								entries={meds}
							>
								{(med) => (
									<Card className="mb-2 py-0 gap-0" key={med.id}>
										<CardContent className="p-3 flex justify-between items-center">
											<div className="flex-1">
												<p className="font-semibold text-base">
													{getRegimenNameById(med.regimenId)} -{' '}
													{med.dosageAmount}
												</p>
												<p className="text-sm text-muted-foreground">
													{new Date(med.timestamp).toLocaleTimeString(
														undefined,
														{ hour: '2-digit', minute: '2-digit' },
													)}
													{' - '}
													<fbt desc="Label for administration status">
														Status:
													</fbt>{' '}
													{med.administrationStatus}
													{med.details && ` (${med.details})`}
												</p>
											</div>
											<div className="flex gap-1">
												<Button
													onClick={() => handleEditAdministration(med.id)}
													size="icon"
													variant="ghost"
												>
													<Edit className="h-4 w-4" />
													<span className="sr-only">
														<fbt desc="Edit administration button label">
															Edit
														</fbt>
													</span>
												</Button>
												<Button
													onClick={() => handleDeleteAdministration(med.id)}
													size="icon"
													variant="ghost"
												>
													<Trash2 className="h-4 w-4" />
													<span className="sr-only">
														<fbt desc="Delete administration button label">
															Delete
														</fbt>
													</span>
												</Button>
											</div>
										</CardContent>
									</Card>
								)}
							</HistoryListInternal>
						</div>
					))
				) : (
					<p>
						<fbt desc="Message when there is no medication administration history">
							No medication administration history.
						</fbt>
					</p>
				)}
			</section>
		</div>
	);
}
