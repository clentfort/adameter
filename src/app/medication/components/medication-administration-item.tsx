import { format } from 'date-fns';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MedicationAdministration } from '@/types/medication'; // Updated type

interface MedicationAdministrationItemProps {
	med: MedicationAdministration;
	onDeleteAdministration: (adminId: string) => void;
	onEditAdministration: (adminId: string) => void;
	// getRegimenNameById is removed as medicationName and dosageUnit are now direct properties
}

export function MedicationAdministrationItem({
	med,
	onDeleteAdministration,
	onEditAdministration,
}: MedicationAdministrationItemProps) {
	return (
		<Card className="mb-2 py-0 gap-0" key={med.id}>
			<CardContent className="p-3 flex justify-between items-center">
				<div className="flex-1">
					<p className="font-medium text-base">
						{med.medicationName} - {med.dosageAmount}
						{med.dosageUnit}
					</p>
					<p className="text-sm text-muted-foreground">
						{format(new Date(med.timestamp), 'h:mm a')}
						{' - '}
						<fbt desc="Label for administration status">Status:</fbt>{' '}
						{med.administrationStatus}
						{med.details && ` (${med.details})`}
					</p>
					{med.regimenId && (
						<p className="text-xs text-muted-foreground italic">
							<fbt desc="Indicator that this administration is linked to a regimen">
								(Linked to regimen)
							</fbt>
						</p>
					)}
				</div>
				<div className="flex gap-1">
					<Button
						onClick={() => onEditAdministration(med.id)}
						size="icon"
						variant="ghost"
					>
						<Edit className="h-4 w-4" />
						<span className="sr-only">
							<fbt desc="Edit administration button label">Edit</fbt>
						</span>
					</Button>
					<Button
						onClick={() => onDeleteAdministration(med.id)}
						size="icon"
						variant="ghost"
					>
						<Trash2 className="h-4 w-4" />
						<span className="sr-only">
							<fbt desc="Delete administration button label">Delete</fbt>
						</span>
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
