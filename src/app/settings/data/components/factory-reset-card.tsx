'use client';

import { fbt } from 'fbtee';
import { useContext, useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { DataSynchronizationContext } from '@/contexts/data-synchronization-context';
import { tinybaseContext } from '@/contexts/tinybase-context';
import { backupAndClearLocalStore } from '@/lib/tinybase-sync/factory-reset';
import { exportStoreAsZip } from '@/utils/data-transfer/export';

export function FactoryResetCard() {
	const { store } = useContext(tinybaseContext);
	const { leaveRoom } = useContext(DataSynchronizationContext);
	const { toast } = useToast();
	const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
	const [resetConfirmationInput, setResetConfirmationInput] = useState('');
	const [isBusy, setIsBusy] = useState(false);

	const handleFactoryReset = async () => {
		setIsBusy(true);
		try {
			leaveRoom();
			await exportStoreAsZip(store);
			await backupAndClearLocalStore(store);
			toast.success(
				fbt('App reset successfully.', 'Success message for factory reset'),
			);
			setIsResetDialogOpen(false);
			window.location.reload();
		} catch {
			toast.error(
				fbt('Failed to reset app.', 'Error message for factory reset failure'),
			);
		} finally {
			setIsBusy(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<fbt desc="Factory reset card title">Factory Reset</fbt>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="mb-4 text-sm">
					<fbt desc="Factory reset description">
						Clear all local data and disconnect from any shared room. This
						action cannot be undone.
					</fbt>
				</p>
				<Button
					disabled={isBusy}
					onClick={() => {
						setResetConfirmationInput('');
						setIsResetDialogOpen(true);
					}}
					variant="destructive"
				>
					{isBusy ? (
						<fbt desc="Resetting button text">Resetting...</fbt>
					) : (
						<fbt desc="Reset button text">Factory Reset</fbt>
					)}
				</Button>

				<AlertDialog
					onOpenChange={setIsResetDialogOpen}
					open={isResetDialogOpen}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>
								<fbt desc="Title for factory reset confirmation dialog">
									Are you absolutely sure?
								</fbt>
							</AlertDialogTitle>
							<AlertDialogDescription>
								<div className="space-y-4">
									<p>
										<fbt desc="Warning message for factory reset">
											This action will permanently delete all your local data
											and disconnect you from any shared room.
										</fbt>
									</p>
									<div className="space-y-2">
										<Label htmlFor="reset-confirmation">
											<fbt desc="Instruction to type a word to confirm reset">
												Please type{' '}
												<fbt:param name="confirmationWord">
													<strong>delete</strong>
												</fbt:param>{' '}
												to confirm.
											</fbt>
										</Label>
										<Input
											id="reset-confirmation"
											onChange={(e) =>
												setResetConfirmationInput(e.target.value)
											}
											placeholder={fbt(
												'Type "delete" here',
												'Placeholder for reset confirmation input',
											).toString()}
											value={resetConfirmationInput}
										/>
									</div>
								</div>
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>
								<fbt common={true}>Cancel</fbt>
							</AlertDialogCancel>
							<AlertDialogAction
								className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
								disabled={
									isBusy ||
									resetConfirmationInput.toLowerCase() !==
										fbt('delete', 'Confirmation word for reset').toString()
								}
								onClick={handleFactoryReset}
							>
								<fbt desc="Button text to confirm factory reset">
									Delete everything
								</fbt>
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</CardContent>
		</Card>
	);
}
