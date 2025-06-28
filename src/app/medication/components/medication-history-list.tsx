'use client';

import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import { useMedication } from '@/hooks/use-medication';
import { Medication } from '@/types/medication';
import MedicationForm from './medication-form';
import MedicationHistoryListItem from './medication-history-list-item';
import '@/i18n';

export default function MedicationHistoryList() {
	const { medicationEntries, remove, update } = useMedication();
	const [editingMedication, setEditingMedication] = useState<Medication | null>(
		null,
	);
	const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(
		null,
	);

	const handleEdit = (item: Medication) => {
		setEditingMedication(item);
	};

	const handleDeleteRequest = (id: string) => {
		setDeleteCandidateId(id);
	};

	const handleDeleteConfirm = () => {
		if (deleteCandidateId) {
			remove(deleteCandidateId);
			setDeleteCandidateId(null);
		}
	};

	const sortedMedicationEntries = [...medicationEntries].sort((a, b) => {
		try {
			const dateA = new Date(a.startDate).getTime();
			const dateB = new Date(b.startDate).getTime();

			// Use Number.isNaN for clarity and to avoid global isNaN pitfalls
			if (Number.isNaN(dateA) && Number.isNaN(dateB)) return 0;
			if (Number.isNaN(dateA)) return 1;
			if (Number.isNaN(dateB)) return -1;

			return dateB - dateA;
		} catch {
			// In case of catastrophic error during date parsing, log to console (dev only ideally)
			// and default to not changing order to prevent crashes.
			// console.error('Error parsing dates during medication sort:', e, a, b);
			return 0;
		}
	});

	if (sortedMedicationEntries.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
				<AlertTriangle className="w-12 h-12 mb-4 text-yellow-500" />
				<p className="mb-2">
					<fbt desc="Message shown when there are no medication entries yet">
						No medication entries yet.
					</fbt>
				</p>
				<p className="text-sm">
					<fbt desc="Instruction to add a new medication entry">
						Click the &quot;Add Entry&quot; button to record a new medication.
					</fbt>
				</p>
			</div>
		);
	}

	return (
		<>
			<div className="space-y-4">
				{sortedMedicationEntries.map((item) => (
					<MedicationHistoryListItem
						item={item}
						key={item.id}
						onDelete={handleDeleteRequest}
						onEdit={handleEdit}
					/>
				))}
			</div>

			{editingMedication && (
				<MedicationForm
					medication={editingMedication}
					onClose={() => setEditingMedication(null)}
					onSave={(updatedItem) => {
						update(updatedItem.id, updatedItem);
						setEditingMedication(null);
					}}
					title={
						<fbt desc="Title for editing an existing medication entry">
							Edit Medication Entry
						</fbt>
					}
				/>
			)}

			{deleteCandidateId && (
				<DeleteEntryDialog
					entryName={
						<fbt desc="Confirmation message name for deleting a medication entry">
							this medication entry
						</fbt>
					}
					onClose={() => setDeleteCandidateId(null)}
					onConfirm={handleDeleteConfirm}
				/>
			)}
		</>
	);
}
