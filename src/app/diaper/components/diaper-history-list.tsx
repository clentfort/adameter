import type { DiaperChange } from '@/types/diaper';
import { format } from 'date-fns';
import { useState } from 'react';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import HistoryListInternal from '@/components/history-list';
import Markdown from '@/components/markdown';
import DeleteIconButton from '@/components/icon-buttons/delete';
import EditIconButton from '@/components/icon-buttons/edit';
import { useDiaperChanges } from '@/hooks/use-diaper-changes';
import { DIAPER_BRAND_LABELS } from '../utils/diaper-brands';
import { isAbnormalTemperature } from '../utils/is-abnormal-temperature';
import DiaperForm from './diaper-form';

export default function DiaperHistoryList() {
	const [changeToDelete, setChangeToDelete] = useState<string | null>(null);
	const [changeToEdit, setChangeToEdit] = useState<DiaperChange | null>(null);
	const { remove, update, value: changes } = useDiaperChanges();

	return (
		<>
			<HistoryListInternal
				dateAccessor={(change) => change.timestamp}
				entries={changes}
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
							className={`border rounded-lg p-4 shadow-xs ${borderColor} ${bgColor}`}
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
												<fbt desc="Label on a field that informs the user about the diaper brand used">
													Diaper Brand
												</fbt>
												:{' '}
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
											<div className="text-sm">
												<fbt desc="Prefix to a user defined text on notes on a diaper change (i.e. rashes, redness.)">
													Notes
												</fbt>
												:
												<Markdown className="text-sm">
													{change.abnormalities}
												</Markdown>
											</div>
										)}
									</div>
								</div>
								<div className="flex gap-1 mt-2">
									<EditIconButton onClick={() => setChangeToEdit(change)} />
									<DeleteIconButton
										onClick={() => setChangeToDelete(change.id)}
									/>
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
					onDelete={(id) => remove(id)}
				/>
			)}
			{changeToEdit && (
				<DiaperForm
					change={changeToEdit}
					onClose={() => setChangeToEdit(null)}
					onSave={update}
					title={<fbt desc="editDiaperEntry">Edit Diaper Entry</fbt>}
				/>
			)}
		</>
	);
}
