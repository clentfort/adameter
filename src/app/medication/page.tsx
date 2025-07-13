'use client';

import { PlusCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import HistoryListInternal from '@/components/history-list';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useMedicationRegimens } from '@/hooks/use-medication-regimens';
import { useMedications } from '@/hooks/use-medications';
import { MedicationAdministration } from '@/types/medication';
import { MedicationRegimen } from '@/types/medication-regimen';
import { MedicationAdministrationForm } from './components/medication-administration-form';
import { MedicationAdministrationItem } from './components/medication-administration-item';
import { MedicationRegimenForm } from './components/medication-regimen-form';
import { RegimenAccordionContent } from './components/regimen-accordion-content';
import { MedicationAdministrationFormData } from './validation/medication-administration-schema';
import '@/i18n';
import { useDueMedications } from '@/hooks/use-due-medications';
import { DueMedications } from './components/due-medications';

const handleDeleteRegimen = (regimenId: string) => {
};

export default function MedicationPage() {
	const {
		add: addRegimen,
		remove: removeRegimen,
		update: updateRegimen,
		value: medicationRegimens,
	} = useMedicationRegimens();

	const {
		add: addMedication,
		remove: removeMedication,
		update: updateMedication,
		value: medications,
	} = useMedications();

	const [isAdministrationFormOpen, setAdministrationFormOpen] = useState(false);
	const [isRegimenFormOpen, setRegimenFormOpen] = useState(false);
	const [editingAdministration, setEditingAdministration] = useState<
		MedicationAdministration | undefined
	>(undefined);
	const [editingRegimen, setEditingRegimen] = useState<
		MedicationRegimen | undefined
	>(undefined);

	const [expandedRegimens, setExpandedRegimens] = useState<
		Record<string, boolean>
	>({});

	const dueMedications = useDueMedications();

	const toggleRegimenExpansion = (regimenId: string) => {
		setExpandedRegimens((prev) => ({ ...prev, [regimenId]: !prev[regimenId] }));
	};

	const handleOpenFormForAdd = () => {
		setEditingAdministration(undefined);
		setAdministrationFormOpen(true);
	};

	const handleOpenFormForEdit = (adminId: string) => {
		const administrationToEdit = (medications || []).find(
			(med) => med.id === adminId,
		);
		if (administrationToEdit) {
			setEditingAdministration(administrationToEdit);
			setAdministrationFormOpen(true);
		}
	};

	const handleEditRegimen = (regimenId: string) => {
		const regimenToEdit = (medicationRegimens || []).find(
			(reg) => reg.id === regimenId,
		);
		if (regimenToEdit) {
			setEditingRegimen(regimenToEdit);
			setRegimenFormOpen(true);
		}
	};

	const handleOpenRegimenFormForAdd = () => {
		setEditingRegimen(undefined);
		setRegimenFormOpen(true);
	};

	const handleSaveRegimen = (regimen: MedicationRegimen) => {
		if (editingRegimen) {
			updateRegimen(regimen); // Assuming updateRegimen handles finding and updating
		} else {
			addRegimen(regimen);
		}
		setRegimenFormOpen(false);
	};

	const handleSaveAdministration = (
		data: MedicationAdministrationFormData,
		id?: string,
	) => {
		if (id) {
			// Editing existing
			const existingAdmin = (medications || []).find((med) => med.id === id);
			if (existingAdmin) {
				updateMedication({ ...existingAdmin, ...data });
			}
		} else {
			// Adding new
			const newAdministration: MedicationAdministration = {
				...data,
				id: crypto.randomUUID(), // Generate a new ID
			};
			addMedication(newAdministration);
		}
		setAdministrationFormOpen(false); // Close form after save
	};

	const handleDeleteAdministration = (adminId: string) => {
		removeMedication(adminId);
	};

	const handleAdministerDueMedication = (regimen: MedicationRegimen) => {
		const newAdministration: Partial<MedicationAdministration> = {
			regimenId: regimen.id,
			name: regimen.name,
			dosageAmount: regimen.dosageAmount,
			dosageUnit: regimen.dosageUnit,
			timestamp: new Date().toISOString(),
			administrationStatus: 'On Time',
		};
		setEditingAdministration(newAdministration as MedicationAdministration);
		setAdministrationFormOpen(true);
	};

	const { activeRegimens, pastRegimens } = useMemo(() => {
		const now = new Date().toISOString();
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

	return (
		<div className="w-full">
			<DueMedications
				dueMedications={dueMedications}
				onAdminister={handleAdministerDueMedication}
			/>
			<section className="mb-8">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold">
						<fbt desc="Section heading for current medication regimens">
							Current Regimens
						</fbt>
					</h2>
					<Button onClick={handleOpenRegimenFormForAdd} size="sm" variant="outline">
						<PlusCircle className="h-4 w-4 mr-1" />
						<fbt desc="Button text to add a new medication regimen">
							Add Regimen
						</fbt>
					</Button>
				</div>
				<div>
					<RegimenAccordionContent
						expandedRegimens={expandedRegimens}
						handleDeleteRegimen={handleDeleteRegimen} // Keep if regimen management is on this page
						handleEditRegimen={handleEditRegimen} // Keep if regimen management is on this page
						isPastSection={false}
						noItemsMessage={
							<p>
								<fbt desc="Message when there are no active regimens">
									No active regimens. Add a new regimen to get started.
								</fbt>
							</p>
						}
						regimens={activeRegimens}
						toggleRegimenExpansion={toggleRegimenExpansion}
					/>
				</div>
				<Accordion
					className="w-full mt-4"
					// defaultValue={['active-regimens']}
					type="multiple"
				>
					<AccordionItem className="border-none" value="past-regimens">
						<AccordionTrigger className="text-xl font-semibold mb-2 hover:no-underline py-2">
							<fbt desc="Accordion title for archived medication regimens">
								Archived
							</fbt>
						</AccordionTrigger>
						<AccordionContent>
							<RegimenAccordionContent
								expandedRegimens={expandedRegimens}
								handleDeleteRegimen={handleDeleteRegimen} // Keep if regimen management is on this page
								handleEditRegimen={handleEditRegimen} // Keep if regimen management is on this page
								isPastSection={true}
								noItemsMessage={
									<p>
										<fbt desc="Message when there are no past regimens">
											No past or discontinued regimens.
										</fbt>
									</p>
								}
								regimens={pastRegimens}
								toggleRegimenExpansion={toggleRegimenExpansion}
							/>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</section>

			<section className="mt-8">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold">
						<fbt desc="Section heading for Medication History">History</fbt>
					</h2>
					<Button onClick={handleOpenFormForAdd} size="sm" variant="outline">
						<PlusCircle className="h-4 w-4 mr-1" />
						<fbt desc="Button text to add a new medication administration entry">
							Add Entry
						</fbt>
					</Button>
				</div>
				<HistoryListInternal
					dateAccessor={(med) => med.timestamp}
					entries={medications || []}
				>
					{(med) => (
						<MedicationAdministrationItem
							key={med.id}
							med={med}
							onDeleteAdministration={handleDeleteAdministration}
							onEditAdministration={handleOpenFormForEdit}
						/>
					)}
				</HistoryListInternal>
			</section>

			{isAdministrationFormOpen && (
				<MedicationAdministrationForm
					allAdministrations={medications || []}
					initialData={editingAdministration}
					onClose={() => setAdministrationFormOpen(false)}
					onSubmit={handleSaveAdministration}
					regimens={medicationRegimens || []}
				/>
			)}
			{isRegimenFormOpen && (
				<MedicationRegimenForm
					initialData={editingRegimen}
					onClose={() => setRegimenFormOpen(false)}
					onSubmit={handleSaveRegimen}
				/>
			)}
		</div>
	);
}
