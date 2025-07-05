'use client';

import { fbt } from 'fbtee';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
	DueMedicationInfo,
	useDueMedications,
} from '@/hooks/use-due-medications';
import { MedicationAdministrationFormData } from '../validation/medication-administration-schema';

export type QuickSubmitData = Pick<
	MedicationAdministrationFormData,
	'medicationName' | 'dosageAmount' | 'dosageUnit' | 'regimenId' | 'administrationStatus'
>;
// No extra fields needed here, timestamp will be set by the form

interface DueMedicationsDisplayProps {
	onSelectDueMedication: (data: QuickSubmitData) => void;
}

export const DueMedicationsDisplay: React.FC<DueMedicationsDisplayProps> = ({
	onSelectDueMedication,
}) => {
	const dueMedications = useDueMedications();

	if (dueMedications.length === 0) {
		return null; // Or a subtle message if preferred
	}

	const handleSelect = (dueInfo: DueMedicationInfo) => {
		onSelectDueMedication({
			administrationStatus: 'On Time',
			dosageAmount: dueInfo.regimen.dosageAmount,
			dosageUnit: dueInfo.regimen.dosageUnit,
			medicationName: dueInfo.regimen.name,
			regimenId: dueInfo.regimen.id,
		});
	};

	return (
		<section className="mb-8">
			<h2 className="text-xl font-semibold mb-3">
				<fbt desc="Section heading for Due Medications">Due Now</fbt>
			</h2>
			<ScrollArea className="w-full whitespace-nowrap">
				<div className="flex space-x-4 pb-4">
					{dueMedications.map((dueInfo) => (
						<Card
							aria-label={fbt(
								'Administer ' + fbt.param('medicationName', dueInfo.regimen.name),
								'Accessibility label for due medication card',
							)}
							className="min-w-[200px] max-w-[280px] cursor-pointer hover:shadow-md transition-shadow"
							key={dueInfo.regimen.id + '_' + dueInfo.dueTime.toISOString()}
							onClick={() => handleSelect(dueInfo)}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') handleSelect(dueInfo);
							}}
							role="button"
							tabIndex={0}
						>
							<CardHeader className="p-4">
								<CardTitle
									className="text-base truncate"
									title={dueInfo.regimen.name}
								>
									{dueInfo.regimen.name}
								</CardTitle>
							</CardHeader>
							<CardContent className="p-4 pt-0">
								<p className="text-sm text-muted-foreground">
									{dueInfo.regimen.dosageAmount} {dueInfo.regimen.dosageUnit}
								</p>
								<Button className="w-full mt-3" size="sm" variant="outline">
									<fbt desc="Button text to administer a due medication">
										Administer
									</fbt>
								</Button>
							</CardContent>
						</Card>
					))}
				</div>
				<ScrollBar orientation="horizontal" />
			</ScrollArea>
		</section>
	);
};
