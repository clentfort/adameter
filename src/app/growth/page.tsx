'use client';

import { fbt } from 'fbtee';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGrowthMeasurements } from '@/hooks/use-growth-measurements';
import MeasurementForm from './components/growth-form';
import GrowthMeasurementsList from './components/growth-list';
import TeethingProgress from './components/teething-progress';

export default function GrowthPage() {
	const [isAddEntryDialogOpen, setIsAddEntryDialogOpen] = useState(false);
	const { add, remove, update, value: measurements } = useGrowthMeasurements();
	return (
		<>
			<div className="w-full">
				<Tabs defaultValue="growth">
					<div className="flex justify-between items-center mb-4 gap-4">
						<TabsList className="grid w-full max-w-[400px] grid-cols-2">
							<TabsTrigger value="growth">
								<fbt desc="growthTab">Growth</fbt>
							</TabsTrigger>
							<TabsTrigger value="teething">
								<fbt desc="teethingTab">Teething</fbt>
							</TabsTrigger>
						</TabsList>
						<TabsContent className="m-0" value="growth">
							<Button
								onClick={() => setIsAddEntryDialogOpen(true)}
								size="sm"
								variant="outline"
							>
								<PlusCircle className="h-4 w-4 mr-1" />
								<fbt common>Add Entry</fbt>
							</Button>
						</TabsContent>
					</div>

					<TabsContent value="growth">
						<GrowthMeasurementsList
							measurements={measurements}
							onMeasurementDelete={remove}
							onMeasurementUpdate={update}
						/>
					</TabsContent>
					<TabsContent value="teething">
						<TeethingProgress />
					</TabsContent>
				</Tabs>
			</div>

			{isAddEntryDialogOpen && (
				<MeasurementForm
					onClose={() => setIsAddEntryDialogOpen(false)}
					onSave={(measurement) => {
						add(measurement);
						setIsAddEntryDialogOpen(false);
					}}
					title={
						<fbt desc="Title of the dialog to manually add a growth measurement">
							Add Growth Measurement
						</fbt>
					}
				/>
			)}
		</>
	);
}
