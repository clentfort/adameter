import type { DiaperChange } from '@/types/diaper';
import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import HistoryListInternal from '@/components/history-list';
import { Button } from '@/components/ui/button';
import { DIAPER_BRAND_LABELS } from '../utils/diaper-brands';
import { isAbnormalTemperature } from '../utils/is-abnormal-temperature';
import DiaperForm from './diaper-form';

interface DiaperHistoryListProps {
	changes: ReadonlyArray<DiaperChange>;
	onDiaperDelete: (changeId: string) => void;
	onDiaperUpdate: (change: DiaperChange) => void;
}

export default function DiaperHistoryList({
	changes = [],
	onDiaperDelete,
	onDiaperUpdate,
}: DiaperHistoryListProps) {
	const [changeToDelete, setChangeToDelete] = useState<string | null>(null);
	const [changeToEdit, setChangeToEdit] = useState<DiaperChange | null>(null);

	return (
		<>
			<HistoryListInternal
				entries={changes}
				keySelector={(change) => change.timestamp}
			>
				{(change) => {
					const isStool = change.containsStool;
					const borderColor = isStool
						? 'border-amber-700/30'
						: 'border-yellow-400/30';
					const bgColor = isStool ? 'bg-amber-700/5' : 'bg-yellow-400/5';
					const textColor = isStool ? 'text-amber-700' : 'text-yellow-800';

					return (
						<div
							className={`border rounded-lg p-4 shadow-sm ${borderColor} ${bgColor}`}
							key={change.id}
						>
							<div className="flex justify-between items-start">
								<div>
									<p className={`font-medium ${textColor}`}>
										{isStool ? (
											<fbt desc="Diaper container urine and stool">
												Urine and Stool
											</fbt>
										) : (
											<fbt desc="Diaper container urine only">Urine Only</fbt>
										)}
									</p>
									<p className="text-xs text-muted-foreground">
										{format(new Date(change.timestamp), 'p')}
									</p>

									<div className="mt-2 text-sm space-y-1">
										{change.temperature && (
											<p
												className={
													isAbnormalTemperature(change.temperature)
														? 'text-red-600 font-medium'
														: ''
												}
											>
												<fbt desc="Label for a measured body temperature in degree Celsius">
													Temperature (°C)
												</fbt>
												:{' '}
												<span className="font-medium">
													{change.temperature} °C
												</span>
												{isAbnormalTemperature(change.temperature) && ' (!)'}
											</p>
										)}
										{change.diaperBrand && (
											<p>
												<fbt desc="diaperBrand">Diaper Brand</fbt>:{' '}
												<span className="font-medium">
													{DIAPER_BRAND_LABELS[change.diaperBrand]}
												</span>
											</p>
										)}
										{change.leakage && (
											<p className="text-amber-600 font-medium">
												<fbt desc="Short information text that a diaper has leaked">
													Diaper leaked
												</fbt>
											</p>
										)}
										{change.abnormalities && (
											<p>
												<fbt desc="Prefix to a user defined text on abnormalities on a diaper change (i.e. rashes, redness.)">
													Abnormalities
												</fbt>
												:{' '}
												<span className="font-medium">
													{change.abnormalities}
												</span>
											</p>
										)}
									</div>
								</div>
								<div className="flex gap-1 mt-2">
									<Button
										className="h-7 w-7"
										onClick={() => setChangeToEdit(change)}
										size="icon"
										variant="ghost"
									>
										<Pencil className="h-4 w-4" />
										<span className="sr-only">
											<fbt common>Edit</fbt>
										</span>
									</Button>
									<Button
										className="h-7 w-7 text-destructive"
										onClick={() => setChangeToDelete(change.id)}
										size="icon"
										variant="ghost"
									>
										<Trash2 className="h-4 w-4" />
										<span className="sr-only">
											<fbt common>Delete</fbt>
										</span>
									</Button>
								</div>
							</div>
						</div>
					);
				}}
			</HistoryListInternal>
			{changeToDelete && (
				<DeleteEntryDialog
					entry={changeToDelete}
					onClose={() => setChangeToDelete(null)}
					onDelete={onDiaperDelete}
				/>
			)}
			{changeToEdit && (
				<DiaperForm
					change={changeToEdit}
					onClose={() => setChangeToEdit(null)}
					onSave={onDiaperUpdate}
					title={<fbt desc="editDiaperEntry">Edit Diaper Entry</fbt>}
				/>
			)}
		</>
	);
}
