import type { DiaperChange } from '@/types/diaper';
import { diaperSchema, type DiaperFormValues } from '@/types/diaper';
import { zodResolver } from '@hookform/resolvers/zod';
import { fbt } from 'fbtee';
import { Plus } from 'lucide-react';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import ProductForm from '@/components/product-form';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useDiaperChanges } from '@/hooks/use-diaper-changes';
import { useDiaperProducts } from '@/hooks/use-diaper-products';
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';
import { dateToTimeInputValue } from '@/utils/date-to-time-input-value';
import { getFrecencySortedProducts } from '../utils/get-frecency-sorted-products';
import { isAbnormalTemperature } from '../utils/is-abnormal-temperature';

export interface AddDiaperProps {
	onClose: () => void;
	onSave: (change: DiaperChange) => void;
	presetDiaperProductId?: string;
	presetType?: 'urine' | 'stool' | undefined;
	title: ReactNode;
}

export interface EditDiaperProps {
	change: DiaperChange;
	onClose: () => void;
	onSave: (change: DiaperChange) => void;
	title: ReactNode;
}

type DiaperFormProps = AddDiaperProps | EditDiaperProps;

export default function DiaperForm(props: AddDiaperProps): ReactNode;
export default function DiaperForm(props: EditDiaperProps): ReactNode;
export default function DiaperForm({
	onClose,
	onSave,
	title,
	...props
}: DiaperFormProps) {
	const { add: addProduct, value: products } = useDiaperProducts();
	const { value: changes } = useDiaperChanges();

	const sortedProducts = useMemo(
		() => getFrecencySortedProducts(products, changes),
		[products, changes],
	);

	const [isAddingProduct, setIsAddingProduct] = useState(false);

	const change = 'change' in props ? props.change : undefined;

	const {
		formState: { isValid },
		handleSubmit,
		register,
		reset,
		setValue,
		watch,
	} = useForm<DiaperFormValues>({
		defaultValues: {
			abnormalities: change?.abnormalities ?? '',
			containsStool:
				'change' in props
					? props.change.containsStool
					: props.presetType === 'stool',
			containsUrine:
				'change' in props
					? props.change.containsUrine
					: props.presetType === undefined ||
						props.presetType === 'urine' ||
						props.presetType === 'stool',
			date: dateToDateInputValue(change?.timestamp ?? new Date()),
			diaperProductId:
				'change' in props
					? (props.change.diaperProductId ?? '')
					: (props.presetDiaperProductId ?? ''),
			leakage: change?.leakage ?? false,
			pottyStool: change?.pottyStool ?? false,
			pottyUrine: change?.pottyUrine ?? false,
			temperature: change?.temperature?.toString() ?? '',
			time: dateToTimeInputValue(change?.timestamp ?? new Date()),
		},
		mode: 'onChange',
		resolver: zodResolver(diaperSchema),
	});

	const containsUrine = watch('containsUrine');
	const containsStool = watch('containsStool');
	const pottyUrine = watch('pottyUrine');
	const pottyStool = watch('pottyStool');
	const hasLeakage = watch('leakage');
	const diaperProductId = watch('diaperProductId');
	const temperature = watch('temperature');

	useEffect(() => {
		if (change) {
			const changeDate = new Date(change.timestamp);
			reset({
				abnormalities: change.abnormalities ?? '',
				containsStool: change.containsStool,
				containsUrine: change.containsUrine,
				date: dateToDateInputValue(changeDate),
				diaperProductId: change.diaperProductId ?? '',
				leakage: change.leakage ?? false,
				pottyStool: change.pottyStool ?? false,
				pottyUrine: change.pottyUrine ?? false,
				temperature: change.temperature?.toString() ?? '',
				time: dateToTimeInputValue(changeDate),
			});
		}
	}, [change, reset]);

	const onSubmit = (values: DiaperFormValues) => {
		const [year, month, day] = values.date.split('-').map(Number);
		const [hours, minutes] = values.time.split(':').map(Number);
		const timestamp = new Date(year, month - 1, day, hours, minutes);

		const updatedChange: DiaperChange = {
			...change,
			abnormalities: values.abnormalities || undefined,
			containsStool: values.containsStool,
			containsUrine: values.containsUrine,
			diaperProductId: values.diaperProductId || undefined,
			id: change?.id || Date.now().toString(),
			leakage: values.leakage || undefined,
			pottyStool: values.pottyStool,
			pottyUrine: values.pottyUrine,
			temperature: values.temperature
				? Number.parseFloat(values.temperature)
				: undefined,
			timestamp: timestamp.toISOString(),
		};

		onSave(updatedChange);
		onClose();
	};

	return (
		<Dialog onOpenChange={(open) => !open && onClose()} open={true}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="grid gap-4 py-2">
						<div className="space-y-3">
							<div className="grid grid-cols-3 gap-3 items-center">
								<div />
								<div className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
									<fbt desc="Urine column header">Urine</fbt>
								</div>
								<div className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
									<fbt desc="Stool column header">Stool</fbt>
								</div>

								<div className="text-sm font-medium">
									<fbt desc="Label for the diaper row in the contents matrix">
										Diaper
									</fbt>
								</div>
								<Button
									className={`h-12 w-full transition-all ${
										containsUrine
											? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900 shadow-xs ring-2 ring-yellow-600 ring-offset-1'
											: 'bg-background hover:bg-muted text-muted-foreground'
									}`}
									data-testid="toggle-diaper-urine"
									onClick={() =>
										setValue('containsUrine', !containsUrine, {
											shouldValidate: true,
										})
									}
									type="button"
									variant="outline"
								>
									<span className="text-xl">💧</span>
								</Button>
								<Button
									className={`h-12 w-full transition-all ${
										containsStool
											? 'bg-amber-700 hover:bg-amber-800 text-white shadow-xs ring-2 ring-amber-900 ring-offset-1'
											: 'bg-background hover:bg-muted text-muted-foreground'
									}`}
									data-testid="toggle-diaper-stool"
									onClick={() =>
										setValue('containsStool', !containsStool, {
											shouldValidate: true,
										})
									}
									type="button"
									variant="outline"
								>
									<span className="text-xl">💩</span>
								</Button>

								<div className="text-sm font-medium">
									<fbt desc="Label for the potty row in the contents matrix">
										Potty
									</fbt>
								</div>
								<Button
									className={`h-12 w-full transition-all ${
										pottyUrine
											? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900 shadow-xs ring-2 ring-yellow-600 ring-offset-1'
											: 'bg-background hover:bg-muted text-muted-foreground'
									}`}
									data-testid="toggle-potty-urine"
									onClick={() =>
										setValue('pottyUrine', !pottyUrine, {
											shouldValidate: true,
										})
									}
									type="button"
									variant="outline"
								>
									<span className="text-xl">💧</span>
								</Button>
								<Button
									className={`h-12 w-full transition-all ${
										pottyStool
											? 'bg-amber-700 hover:bg-amber-800 text-white shadow-xs ring-2 ring-amber-900 ring-offset-1'
											: 'bg-background hover:bg-muted text-muted-foreground'
									}`}
									data-testid="toggle-potty-stool"
									onClick={() =>
										setValue('pottyStool', !pottyStool, {
											shouldValidate: true,
										})
									}
									type="button"
									variant="outline"
								>
									<span className="text-xl">💩</span>
								</Button>
							</div>

							<div className="flex items-center space-x-2">
								<Switch
									checked={hasLeakage}
									id="edit-leakage"
									onCheckedChange={(checked) =>
										setValue('leakage', checked, { shouldValidate: true })
									}
								/>
								<Label htmlFor="edit-leakage">
									<fbt desc="Label for a switch button that indicates that a diaper has leaked">
										Diaper leaked
									</fbt>
								</Label>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="edit-date">
									<fbt common>Date</fbt>
								</Label>
								<Input id="edit-date" type="date" {...register('date')} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-time">
									<fbt common>Time</fbt>
								</Label>
								<Input id="edit-time" type="time" {...register('time')} />
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="edit-diaper-product">
								<fbt desc="Label on a select that allows the user to pick a diaper product">
									Product
								</fbt>
							</Label>
							<div className="flex gap-2">
								<div className="flex-grow">
									<Select
										onValueChange={(val) =>
											setValue('diaperProductId', val, { shouldValidate: true })
										}
										value={diaperProductId}
									>
										<SelectTrigger id="edit-diaper-product">
											<SelectValue
												placeholder={
													<fbt desc="Placeholder text on a select that allows the user to pick a diaper product">
														Select Product
													</fbt>
												}
											/>
										</SelectTrigger>
										<SelectContent>
											{sortedProducts
												.filter(
													(p) =>
														!p.archived ||
														p.id === diaperProductId ||
														p.id === change?.diaperProductId,
												)
												.map((product) => (
													<SelectItem key={product.id} value={product.id}>
														{product.name}
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								</div>
								<Button
									onClick={() => setIsAddingProduct(true)}
									size="icon"
									type="button"
									variant="outline"
								>
									<Plus className="h-4 w-4" />
								</Button>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="edit-temperature">
								<fbt desc="Label on an input to specificy the body temperature in degree Celsius">
									Temperature (°C)
								</fbt>
							</Label>
							<Input
								className={
									temperature &&
									isAbnormalTemperature(Number.parseFloat(temperature))
										? 'border-red-500'
										: ''
								}
								id="edit-temperature"
								placeholder={fbt(
									'e.g. 37.2',
									'Placeholder text for an input to set the body temperature in degree Celsius',
								)}
								step="0.1"
								type="number"
								{...register('temperature')}
							/>
							{temperature &&
								isAbnormalTemperature(Number.parseFloat(temperature)) && (
									<p className="text-xs text-red-500 mt-1">
										<fbt desc="A warning that the temperature is outside the normal range">
											Warning: Temperature outside normal range (36.5°C - 37.5°C)
										</fbt>
									</p>
								)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="edit-notes">
								<fbt desc="Label for a textbox to note any notes">Notes</fbt>
							</Label>
							<Textarea
								id="edit-notes"
								placeholder={fbt(
									'e.g. redness, rash, etc.',
									'Placeholder text for a textbox to note any notes',
								)}
								{...register('abnormalities')}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button onClick={onClose} type="button" variant="outline">
							<fbt common>Cancel</fbt>
						</Button>
						<Button data-testid="save-button" type="submit">
							<fbt common>Save</fbt>
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>

			{isAddingProduct && (
				<Dialog onOpenChange={(open) => !open && setIsAddingProduct(open)} open={true}>
					<DialogContent className="sm:max-w-[425px]">
						<DialogHeader>
							<DialogTitle>
								<fbt desc="Title for the quick-add product dialog">
									Add Product
								</fbt>
							</DialogTitle>
						</DialogHeader>
						<ProductForm
							onCancel={() => setIsAddingProduct(false)}
							onSave={(product) => {
								addProduct(product);
								setValue('diaperProductId', product.id, {
									shouldValidate: true,
								});
								setIsAddingProduct(false);
							}}
						/>
					</DialogContent>
				</Dialog>
			)}
		</Dialog>
	);
}
