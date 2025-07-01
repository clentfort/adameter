'use client';

import { useMemo, useState } from 'react';
import HistoryListInternal from '@/components/history-list';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';
// Card components are now used in sub-components
import { useMedicationRegimens } from '@/hooks/use-medication-regimens';
import { useMedications } from '@/hooks/use-medications';
// Ensure Medication type is imported if not already
import { MedicationRegimen } from '@/types/medication-regimen';
import '@/i18n';
import { MedicationAdministrationItem } from './components/medication-administration-item';
import { RegimenAccordionContent } from './components/regimen-accordion-content';

// calculateNextDue and formatSchedule are now used by sub-components, imported within them from utils.ts

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

	const getRegimenNameById = (regimenId: string) => {
		// Ensure medicationRegimens is an array before calling find
		const regimen = (medicationRegimens || []).find((r) => r.id === regimenId);
		return regimen ? regimen.name : 'Unknown Medication';
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
								handleDeleteRegimen={handleDeleteRegimen}
								handleEditRegimen={handleEditRegimen}
								isPastSection={false}
								noItemsMessage={
									<p>
										<fbt desc="Message when there are no active regimens">
											No active regimens.
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
								handleDeleteRegimen={handleDeleteRegimen}
								handleEditRegimen={handleEditRegimen}
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
					{/* Placeholder for a potential "Add Administration" button, similar to other pages */}
					{/* <Button size="sm" variant="outline"><PlusCircle className="h-4 w-4 mr-1" /> <fbt>Add Administration</fbt></Button> */}
				</div>
				<HistoryListInternal
					dateAccessor={(med) => med.timestamp}
					entries={medications || []} // Pass medications directly, ensure it's an array
				>
					{(med) => (
						<MedicationAdministrationItem
							getRegimenNameById={getRegimenNameById}
							key={med.id}
							med={med}
							onDeleteAdministration={handleDeleteAdministration}
							onEditAdministration={handleEditAdministration}
						/>
					)}
				</HistoryListInternal>
			</section>
		</div>
	);
}
