'use client';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { DiaperChange } from '@/types/diaper';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import EditDiaperDialog from './edit-diaper-dialog';

interface DiaperHistoryListProps {
	changes: DiaperChange[];
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

	// Ensure changes is an array
	const changesArray = Array.isArray(changes) ? changes : [];

	if (changesArray.length === 0) {
		return (
			<p className="text-muted-foreground text-center py-4">
				<fbt desc="noDiapersRecorded">No diaper changes recorded yet.</fbt>
			</p>
		);
	}

	const handleDeleteConfirm = () => {
		if (changeToDelete) {
			onDiaperDelete(changeToDelete);
			setChangeToDelete(null);
		}
	};

	// Group changes by date
	const groupedChanges: { [date: string]: DiaperChange[] } = {};

	changesArray.forEach((change) => {
		const date = format(new Date(change.timestamp), 'yyyy-MM-dd');
		if (!groupedChanges[date]) {
			groupedChanges[date] = [];
		}
		groupedChanges[date].push(change);
	});

	const isAbnormalTemperature = (temp: number | undefined) => {
		if (temp === undefined) return false;
		return temp < 36.5 || temp > 37.5;
	};

	return (
		<>
			<div className="space-y-4">
				{Object.entries(groupedChanges).map(([date, dateChanges]) => (
					<div className="space-y-2" key={date}>
						<div className="bg-muted/50 px-4 py-2 rounded-md text-sm font-medium">
							{format(new Date(date), 'EEEE, d. MMMM yyyy', { locale: de })}
						</div>

						{dateChanges.map((change) => {
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
													<fbt desc="Diaper container urine only">
														Urine Only
													</fbt>
												)}
											</p>
											<p className="text-xs text-muted-foreground">
												{format(new Date(change.timestamp), 'h:mm a', {
													locale: de,
												})}
											</p>

											{(change.temperature ||
												change.diaperBrand ||
												change.leakage ||
												change.abnormalities) && (
												<div className="mt-2 text-sm space-y-1">
													{change.temperature && (
														<p
															className={
																isAbnormalTemperature(change.temperature)
																	? 'text-red-600 font-medium'
																	: ''
															}
														>
															<fbt desc="temperature">Temperature (°C)</fbt>:{' '}
															<span className="font-medium">
																{change.temperature} °C
															</span>
															{isAbnormalTemperature(change.temperature) &&
																' (!)'}
														</p>
													)}
													{change.diaperBrand && (
														<p>
															<fbt desc="diaperBrand">Diaper Brand</fbt>:{' '}
															<span className="font-medium">
																{change.diaperBrand === 'pampers'
																	? 'Pampers'
																	: change.diaperBrand === 'huggies'
																		? 'Huggies'
																		: change.diaperBrand === 'lillydoo'
																			? 'Lillydoo'
																			: change.diaperBrand === 'dm'
																				? 'dm'
																				: change.diaperBrand === 'rossmann'
																					? 'Rossmann'
																					: change.diaperBrand === 'stoffwindel'
																						? 'Stoffwindel'
																						: change.diaperBrand}
															</span>
														</p>
													)}
													{change.leakage && (
														<p className="text-amber-600 font-medium">
															<fbt desc="leakage">Diaper leaked</fbt>
														</p>
													)}
													{change.abnormalities && (
														<p>
															<fbt desc="abnormalities">Abnormalities</fbt>:{' '}
															<span className="font-medium">
																{change.abnormalities}
															</span>
														</p>
													)}
												</div>
											)}
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
													<fbt desc="edit">Edit</fbt>
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
													<fbt desc="delete">Delete</fbt>
												</span>
											</Button>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				))}
			</div>
			<AlertDialog
				onOpenChange={(open) => !open && setChangeToDelete(null)}
				open={!!changeToDelete}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							<fbt desc="deleteEntry">Delete Entry</fbt>
						</AlertDialogTitle>
						<AlertDialogDescription>
							<fbt desc="deleteConfirmation">
								Do you really want to delete this entry? This action cannot be
								undone.
							</fbt>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>
							<fbt desc="cancel">Cancel</fbt>
						</AlertDialogCancel>
						<AlertDialogAction onClick={handleDeleteConfirm}>
							<fbt desc="delete">Delete</fbt>
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			{changeToEdit && (
				<EditDiaperDialog
					allChanges={changesArray}
					change={changeToEdit}
					onClose={() => setChangeToEdit(null)}
					onUpdate={onDiaperUpdate}
				/>
			)}
		</>
	);
}
