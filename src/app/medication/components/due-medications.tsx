import { MedicationRegimen } from '@/types/medication-regimen';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface DueMedicationsProps {
	dueMedications: MedicationRegimen[];
	onAdminister: (regimen: MedicationRegimen) => void;
}

export const DueMedications = ({
	dueMedications,
	onAdminister,
}: DueMedicationsProps) => {
	if (dueMedications.length === 0) return null;

	return (
		<section className="mb-8">
			<h2 className="text-xl font-semibold mb-4">
				<fbt desc="Section heading for due medications">Due Medications</fbt>
			</h2>
			<ScrollArea className="w-full whitespace-nowrap">
				<div className="flex space-x-4">
					{dueMedications.map((regimen) => (
						<Button
							key={regimen.id}
							variant="outline"
							className="h-auto"
							onClick={() => onAdminister(regimen)}
						>
							<div className="flex flex-col items-start">
								<span className="font-semibold">{regimen.name}</span>
								<span>
									{regimen.dosageAmount} {regimen.dosageUnit}
								</span>
							</div>
						</Button>
					))}
				</div>
				<ScrollBar orientation="horizontal" />
			</ScrollArea>
		</section>
	);
};
