'use client';

import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTeeth } from '@/hooks/use-teeth';
import TeethChart from './components/teeth-chart';
import ToothForm from './components/tooth-form';

export default function TeethingPage() {
	const { add } = useTeeth();
	const [isAddEntryDialogOpen, setIsAddEntryDialogOpen] = useState(false);
	return (
		<>
			<div className="w-full">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold">
						<fbt desc="Title of the teething page">Teething</fbt>
					</h2>
					<Button
						onClick={() => setIsAddEntryDialogOpen(true)}
						size="sm"
						variant="outline"
					>
						<PlusCircle className="h-4 w-4 mr-1" />
						<fbt common>Add Entry</fbt>
					</Button>
				</div>

				<TeethChart />
			</div>

			{isAddEntryDialogOpen && (
				<ToothForm
					onClose={() => setIsAddEntryDialogOpen(false)}
					onSave={(tooth) => {
						add(tooth);
						setIsAddEntryDialogOpen(false);
					}}
					title={
						<fbt desc="Title of the dialog to add a tooth">
							Add Tooth
						</fbt>
					}
				/>
			)}
		</>
	);
}