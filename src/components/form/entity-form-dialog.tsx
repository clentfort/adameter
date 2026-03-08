import type { ReactNode } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import { fbt } from 'fbtee';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

interface EntityFormDialogProps<
	TFieldValues extends FieldValues = FieldValues,
	TTransformedValues extends FieldValues | undefined = undefined,
> {
	children: ReactNode;
	footer?: ReactNode;
	form: UseFormReturn<TFieldValues, any, TTransformedValues>;
	onClose: () => void;
	onSave: (
		data: TTransformedValues extends undefined
			? TFieldValues
			: TTransformedValues,
		event?: React.BaseSyntheticEvent,
	) => void;
	title: ReactNode;
}

export function EntityFormDialog<
	TFieldValues extends FieldValues = FieldValues,
	TTransformedValues extends FieldValues | undefined = undefined,
>({
	children,
	footer,
	form,
	onClose,
	onSave,
	title,
}: EntityFormDialogProps<TFieldValues, TTransformedValues>) {
	const { handleSubmit } = form;

	return (
		<Dialog onOpenChange={(open) => !open && onClose()} open={true}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<form
					onSubmit={(e) => {
						void handleSubmit(onSave as any)(e);
					}}
				>
					{children}
					{footer ?? (
						<DialogFooter className="mt-6">
							<Button onClick={onClose} type="button" variant="outline">
								<fbt common>Cancel</fbt>
							</Button>
							<Button data-testid="save-button" type="submit">
								<fbt common>Save</fbt>
							</Button>
						</DialogFooter>
					)}
				</form>
			</DialogContent>
		</Dialog>
	);
}
