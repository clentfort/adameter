import { MedicationRegimen } from '@/types/medication-regimen';
import { calculateNextDue } from '../utils/next-due-calculation';
import { MedicationRegimenCard } from './medication-regimen-card';

interface RegimenAccordionContentProps {
	expandedRegimens: Record<string, boolean>;
	handleDeleteRegimen: (regimenId: string) => void;
	handleEditRegimen: (regimenId: string) => void;
	isPastSection: boolean;
	noItemsMessage: JSX.Element; // Allow passing the fbt message
	regimens: MedicationRegimen[];
	toggleRegimenExpansion: (regimenId: string) => void;
}

export function RegimenAccordionContent({
	expandedRegimens,
	handleDeleteRegimen,
	handleEditRegimen,
	isPastSection,
	noItemsMessage,
	regimens,
	toggleRegimenExpansion,
}: RegimenAccordionContentProps) {
	return (
		<div className="space-y-4">
			{regimens.length > 0
				? regimens.map((regimen) => (
						<MedicationRegimenCard
							isExpanded={!!expandedRegimens[regimen.id]}
							isPast={isPastSection}
							key={regimen.id}
							nextDueText={
								!isPastSection ? calculateNextDue(regimen) : undefined
							}
							onDeleteRegimen={handleDeleteRegimen}
							onEditRegimen={handleEditRegimen}
							onToggleExpansion={() => toggleRegimenExpansion(regimen.id)}
							regimen={regimen}
						/>
					))
				: noItemsMessage}
		</div>
	);
}
