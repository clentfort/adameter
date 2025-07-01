import { format } from 'date-fns';
import { fbt } from 'fbtee'; // Ensure fbt is imported
import { ChevronDown, ChevronUp, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from '@/components/ui/card';
import { MedicationRegimen } from '@/types/medication-regimen';
import { formatSchedule } from '../utils/format-schedule';

const formatDateDisplay = (dateString?: string) => {
	if (!dateString) return String(fbt('N/A', 'Not applicable or not available'));
	try {
		return format(new Date(dateString), 'MMMM d, yyyy');
	} catch {
		return String(
			fbt('Invalid Date', 'Error message for an invalid date string'),
		);
	}
};

interface MedicationRegimenCardProps {
	isExpanded: boolean;
	isPast?: boolean; // To differentiate styling or content for past regimens
	nextDueText?: string; // Only for active regimens
	onDeleteRegimen: (regimenId: string) => void;
	onEditRegimen: (regimenId: string) => void;
	onToggleExpansion: () => void;
	regimen: MedicationRegimen;
}

export function MedicationRegimenCard({
	isExpanded,
	isPast = false,
	nextDueText,
	onDeleteRegimen,
	onEditRegimen,
	onToggleExpansion,
	regimen,
}: MedicationRegimenCardProps) {
	return (
		<Card className="py-4 gap-3" key={regimen.id}>
			<CardHeader className="pb-3 px-4">
				<div className="flex justify-between items-start">
					<div>
						<h3 className="text-lg font-medium">{regimen.name}</h3>
						<p className="text-sm text-muted-foreground">
							<fbt desc="Label for dosage">Dosage:</fbt> {regimen.dosageAmount}{' '}
							{regimen.dosageUnit}
						</p>
					</div>
					<div className="flex gap-1">
						<Button
							onClick={() => onEditRegimen(regimen.id)}
							size="icon"
							variant="ghost"
						>
							<Edit className="h-4 w-4" />
							<span className="sr-only">
								<fbt desc="Edit regimen button label">Edit</fbt>
							</span>
						</Button>
						<Button
							onClick={() => onDeleteRegimen(regimen.id)}
							size="icon"
							variant="ghost"
						>
							<Trash2 className="h-4 w-4" />
							<span className="sr-only">
								<fbt desc="Delete regimen button label">Delete</fbt>
							</span>
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent className="pb-3 px-4">
				{!isPast && nextDueText && (
					<p className="text-sm font-medium">
						<fbt desc="Label for next due time">Next Due:</fbt> {nextDueText}
					</p>
				)}
				{isPast && (
					<>
						<p className="text-sm">
							<strong>
								<fbt desc="Label for start date">Start Date:</fbt>
							</strong>{' '}
							{formatDateDisplay(regimen.startDate)}
						</p>
						{regimen.endDate && (
							<p className="text-sm">
								<strong>
									<fbt desc="Label for end date">End Date:</fbt>
								</strong>{' '}
								{formatDateDisplay(regimen.endDate)}
							</p>
						)}
						{regimen.isDiscontinued && (
							<p className="text-sm text-red-600 font-semibold">
								<fbt desc="Indicator that a regimen is discontinued">
									Discontinued
								</fbt>
							</p>
						)}
					</>
				)}
				{isExpanded && (
					<div className="mt-3 space-y-1 text-sm">
						<p>
							<strong>
								<fbt desc="Label for schedule">Schedule:</fbt>
							</strong>{' '}
							{formatSchedule(regimen.schedule)}
						</p>
						{!isPast && ( // Show start/end date for active regimens only when expanded
							<>
								<p>
									<strong>
										<fbt desc="Label for start date">Start Date:</fbt>
									</strong>{' '}
									{formatDateDisplay(regimen.startDate)}
								</p>
								{regimen.endDate && (
									<p>
										<strong>
											<fbt desc="Label for end date">End Date:</fbt>
										</strong>{' '}
										{formatDateDisplay(regimen.endDate)}
									</p>
								)}
							</>
						)}
						<p>
							<strong>
								<fbt desc="Label for prescriber">Prescriber:</fbt>
							</strong>{' '}
							{regimen.prescriber}{' '}
							{regimen.prescriberName && `(${regimen.prescriberName})`}
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
					onClick={onToggleExpansion}
					size="sm"
					variant="link"
				>
					{isExpanded ? (
						<>
							<ChevronUp className="h-3 w-3 mr-1" />
							<fbt desc="Button to collapse regimen details">Show Less</fbt>
						</>
					) : (
						<>
							<ChevronDown className="h-3 w-3 mr-1" />
							<fbt desc="Button to expand regimen details">Show More</fbt>
						</>
					)}
				</Button>
			</CardFooter>
		</Card>
	);
}
