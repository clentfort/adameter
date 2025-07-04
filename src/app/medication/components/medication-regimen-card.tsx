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
		<Card className="mb-4" key={regimen.id}>
			<CardHeader className="pb-2 pt-4 px-4">
				<div className="flex justify-between items-start gap-2">
					<div className="flex-grow">
						<h3 className="text-xl font-semibold">{regimen.name}</h3>
						<p className="text-sm text-muted-foreground">
							<fbt desc="Label for dosage">Dosage:</fbt> {regimen.dosageAmount}{' '}
							{regimen.dosageUnit}
						</p>
					</div>
					<div className="flex flex-shrink-0 gap-1">
						<Button
							className="h-8 w-8"
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
							className="h-8 w-8"
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
			<CardContent className="px-4 pb-3 space-y-3">
				{!isPast && nextDueText && (
					<p className="text-sm font-medium text-blue-600 dark:text-blue-400">
						<fbt desc="Label for next due time">Next Due:</fbt> {nextDueText}
					</p>
				)}
				{isPast && (
					<div className="space-y-1 text-sm">
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
						{regimen.isDiscontinued && (
							<p className="text-sm text-red-600 font-semibold">
								<fbt desc="Indicator that a regimen is discontinued">
									Discontinued
								</fbt>
							</p>
						)}
					</div>
				)}

				{regimen.notes && (
					<div className="text-sm pt-1">
						<p className="font-medium text-gray-700 dark:text-gray-300">
							<fbt desc="Label for notes">Notes:</fbt>
						</p>
						<p className="text-muted-foreground whitespace-pre-wrap">
							{regimen.notes}
						</p>
					</div>
				)}

				{isExpanded && (
					<div className="pt-2 space-y-2 text-sm border-t border-border/40">
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
					</div>
				)}
			</CardContent>
			<CardFooter className="px-4 pb-4 pt-0">
				<Button
					className="text-xs p-0 h-auto text-muted-foreground hover:text-foreground"
					onClick={onToggleExpansion}
					size="sm"
					variant="link"
				>
					{isExpanded ? (
						<>
							<ChevronUp className="h-3.5 w-3.5 mr-1" />
							<fbt desc="Button to collapse regimen details">Show Less</fbt>
						</>
					) : (
						<>
							<ChevronDown className="h-3.5 w-3.5 mr-1" />
							<fbt desc="Button to expand regimen details">Show More</fbt>
						</>
					)}
				</Button>
			</CardFooter>
		</Card>
	);
}
