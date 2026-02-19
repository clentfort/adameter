import type { MedicationRegimen } from '@/types/medication';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';

export default function PastRegimens({
	regimens,
}: {
	regimens: MedicationRegimen[];
}) {
	return (
		<Accordion collapsible type="single">
			<AccordionItem value="past-regimens">
				<AccordionTrigger>
					<fbt desc="Label for past medication regimens">Past Regimens</fbt> (
					{regimens.length})
				</AccordionTrigger>
				<AccordionContent>
					<div className="space-y-2">
						{regimens.map((regimen) => (
							<div className="p-3 border rounded-lg" key={regimen.id}>
								<div className="font-medium">{regimen.name}</div>
								<div className="text-sm text-muted-foreground">
									{regimen.dosage} {regimen.unit} • Finished on{' '}
									{regimen.endDate
										? new Date(regimen.endDate).toLocaleDateString()
										: 'Unknown'}
								</div>
							</div>
						))}
					</div>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
}
