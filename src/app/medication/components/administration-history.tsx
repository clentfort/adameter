'use client';

import type { MedicationAdministration } from '@/types/medication';
import { format } from 'date-fns';
import { Ban, CheckCircle2, Clock } from 'lucide-react';
import { useState } from 'react';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import HistoryListInternal from '@/components/history-list';
import DeleteIconButton from '@/components/icon-buttons/delete';
import EditIconButton from '@/components/icon-buttons/edit';
import Markdown from '@/components/markdown';
import { useMedicationAdministrations } from '@/hooks/use-medication-administrations';
import MedicationAdministrationForm from './medication-administration-form';

export default function AdministrationHistory() {
	const { remove, update, value: history } = useMedicationAdministrations();
	const [adminToDelete, setAdminToDelete] = useState<string | null>(null);
	const [adminToEdit, setAdminToEdit] =
		useState<MedicationAdministration | null>(null);

	return (
		<>
			<HistoryListInternal
				dateAccessor={(entry) => entry.timestamp}
				entries={history}
			>
				{(entry) => {
					const isSkipped = entry.status === 'skipped';
					const isMissed = entry.status === 'missed';

					return (
						<div
							className={`border rounded-lg p-4 shadow-xs ${
								isSkipped || isMissed
									? 'bg-muted border-muted-foreground/20 text-muted-foreground'
									: 'bg-primary/5 border-primary/20 text-primary'
							}`}
							key={entry.id}
						>
							<div className="flex justify-between items-start">
								<div className="flex-1">
									<div className="flex items-center gap-2">
										{isSkipped ? (
											<Ban className="h-4 w-4 text-muted-foreground" />
										) : isMissed ? (
											<Clock className="h-4 w-4 text-red-500" />
										) : (
											<CheckCircle2 className="h-4 w-4 text-green-600" />
										)}
										<p className="font-bold">{entry.name}</p>
									</div>
									<p className="text-xs opacity-70">
										{format(new Date(entry.timestamp), 'p')} • {entry.dosage}{' '}
										{entry.unit}
										{entry.status !== 'administered' && (
											<span className="ml-2 uppercase text-[10px] font-black">
												({entry.status})
											</span>
										)}
									</p>

									{entry.prescribedBy && (
										<p className="text-[10px] mt-1 italic">
											<fbt desc="Label for prescriber in history">By:</fbt>{' '}
											{entry.prescribedBy}
										</p>
									)}

									{entry.note && (
										<div className="mt-2 text-sm">
											<Markdown className="text-sm opacity-80">
												{entry.note}
											</Markdown>
										</div>
									)}
								</div>
								<div className="flex gap-1 ml-2">
									<EditIconButton onClick={() => setAdminToEdit(entry)} />
									<DeleteIconButton
										onClick={() => setAdminToDelete(entry.id)}
									/>
								</div>
							</div>
						</div>
					);
				}}
			</HistoryListInternal>

			{adminToDelete && (
				<DeleteEntryDialog
					entry={adminToDelete}
					onClose={() => setAdminToDelete(null)}
					onDelete={remove}
				/>
			)}

			{adminToEdit && (
				<MedicationAdministrationForm
					admin={adminToEdit}
					onClose={() => setAdminToEdit(null)}
					onSave={(updated) => {
						update(updated);
						setAdminToEdit(null);
					}}
				/>
			)}
		</>
	);
}
