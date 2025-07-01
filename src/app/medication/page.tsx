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
import { RegimenAccordionContent } from './components/regimen-accordion-content';
import { MedicationAdministrationFormData } from './validation/medication-administration-schema';
import '@/i18n'; // Ensure i18n is loaded

// Placeholder functions for regimen edit/delete actions (if needed for this page)
const handleEditRegimen = (regimenId: string) => {
	// console.log('Edit regimen:', regimenId); // Removed console.log
	/* Placeholder for actual edit logic */
};
const handleDeleteRegimen = (regimenId: string) => {
	// console.log('Delete regimen:', regimenId); // Removed console.log
	/* Placeholder for actual edit logic */
};

export default function MedicationPage() {
	const {
		// remove: removeRegimen, // Not used directly in this version for regimen deletion
		// update: updateRegimen, // Not used directly in this version for regimen update
		value: medicationRegimens,
	} = useMedicationRegimens();

	const {
		add: addMedication,
		remove: removeMedication,
		update: updateMedication,
		value: medications,
	} = useMedications();

	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingAdministration, setEditingAdministration] = useState<
		MedicationAdministration | undefined
	>(undefined);

	const [expandedRegimens, setExpandedRegimens] = useState<
		Record<string, boolean>
	>({});

	const toggleRegimenExpansion = (regimenId: string) => {
		setExpandedRegimens((prev) => ({ ...prev, [regimenId]: !prev[regimenId] }));
	};

	const handleOpenFormForAdd = () => {
		setEditingAdministration(undefined);
		setIsFormOpen(true);
	};

	const handleOpenFormForEdit = (adminId: string) => {
		const administrationToEdit = (medications || []).find(
			(med) => med.id === adminId,
		);
		if (administrationToEdit) {
			setEditingAdministration(administrationToEdit);
			setIsFormOpen(true);
		}
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
		setIsFormOpen(false); // Close form after save
	};

	const handleDeleteAdministration = (adminId: string) => {
		removeMedication(adminId);
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

	// This function will be deprecated for direct display once history list is updated,
	// but might still be useful for other logic if needed.
	const getRegimenNameById = (regimenId?: string) => {
		if (!regimenId) return 'N/A (One-off)';
		const regimen = (medicationRegimens || []).find((r) => r.id === regimenId);
		return regimen ? regimen.name : 'Unknown Regimen';
	};

	return (
		<div className="w-full">
			<section className="mb-8">
				<Accordion
					className="w-full"
					defaultValue={['active-regimens']}
					type="multiple"
				>
					<AccordionItem className="border-none" value="active-regimens">
						<AccordionTrigger className="text-xl font-semibold mb-2 hover:no-underline py-2">
							<fbt desc="Accordion title for current medication regimens">
								Current Regimens
							</fbt>
						</AccordionTrigger>
						<AccordionContent>
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
						</AccordionContent>
					</AccordionItem>
					<AccordionItem className="border-none mt-4" value="past-regimens">
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
							// getRegimenNameById prop removed
							key={med.id}
							med={med}
							onDeleteAdministration={handleDeleteAdministration}
							onEditAdministration={handleOpenFormForEdit}
						/>
					)}
				</HistoryListInternal>
			</section>

			{isFormOpen && (
				<MedicationAdministrationForm
					allAdministrations={medications || []}
					initialData={editingAdministration}
					isOpen={isFormOpen}
					onClose={() => setIsFormOpen(false)}
					onSubmit={handleSaveAdministration}
					regimens={medicationRegimens || []}
				/>
			)}
		</div>
	);
}
