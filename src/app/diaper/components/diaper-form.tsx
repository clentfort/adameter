import type { DiaperChange } from '@/types/diaper';
import { format } from 'date-fns';
import { fbt } from 'fbtee';
import { ReactNode, useEffect, useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { DIAPER_BRANDS } from '../utils/diaper-brands';
import { isAbnormalTemperature } from '../utils/is-abnormal-temperature';

interface AddDiaperProps {
	onClose: () => void;
	onSave: (change: DiaperChange) => void;
	presetDiaperBrand: string | undefined;
	presetType?: 'urine' | 'stool' | undefined;
	/**
	 * Whether the dialog is reduced or not
	 */
	reducedOptions?: boolean;
	title: ReactNode;
}

interface EditDiaperProps {
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
	const [date, setDate] = useState(
		'change' in props
			? dateToDateString(new Date(props.change.timestamp))
			: dateToDateString(new Date()),
	);
	const [time, setTime] = useState(
		'change' in props
			? dateToTimeString(new Date(props.change.timestamp))
			: dateToTimeString(new Date()),
	);
	const [diaperType, setDiaperType] = useState<'urine' | 'stool'>(
		'change' in props
			? props.change.containsStool
				? 'stool'
				: 'urine'
			: (props.presetType ?? 'urine'),
	);
	const [diaperBrand, setDiaperBrand] = useState(
		'change' in props
			? props.change.diaperBrand
			: (props.presetDiaperBrand ?? 'andere'),
	);
	const [temperature, setTemperature] = useState(
		'change' in props ? props.change.temperature?.toString() || '' : '',
	);
	const [hasLeakage, setHasLeakage] = useState(
		'change' in props ? (props.change.leakage ?? false) : false,
	);
	const [abnormalities, setAbnormalities] = useState(
		'change' in props ? (props.change.abnormalities ?? '') : '',
	);

	const change = 'change' in props ? props.change : undefined;

	useEffect(() => {
		if (!change) {
			return;
		}

		const changeDate = new Date(change.timestamp);
		setDate(format(changeDate, 'yyyy-MM-dd'));
		setTime(format(changeDate, 'HH:mm'));
		setDiaperType(change.containsStool ? 'stool' : 'urine');

		// Check if the brand is in our predefined list
		const isPredefinedBrand = DIAPER_BRANDS.some(
			(brand) => brand.value === change.diaperBrand,
		);
		if (change.diaperBrand && !isPredefinedBrand) {
			setDiaperBrand('andere');
		} else {
			setDiaperBrand(change.diaperBrand || '');
		}

		setTemperature(change.temperature ? change.temperature.toString() : '');
		setHasLeakage(change.leakage || false);
		setAbnormalities(change.abnormalities || '');
	}, [change]);

	const handleSubmit = () => {
		if (!date || !time) return;

		const [year, month, day] = date.split('-').map(Number);
		const [hours, minutes] = time.split(':').map(Number);
		const timestamp = new Date(year, month - 1, day, hours, minutes);

		const updatedChange: DiaperChange = {
			...change,
			abnormalities: abnormalities || undefined,
			containsStool: diaperType === 'stool',

			// Always true, as stool usually comes with urine
			containsUrine: true,
			diaperBrand: diaperBrand || undefined,
			id: change?.id || Date.now().toString(),
			leakage: hasLeakage || undefined,
			temperature: temperature ? Number.parseFloat(temperature) : undefined,
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
				<div className="grid gap-4 py-4">
					{!('reducedOptions' in props && props.reducedOptions === true) && (
						<>
							<div className="space-y-2">
								<Label>
									<fbt desc="Label on a radio button to select the type of diaper (urine or stool)">
										Diaper Type
									</fbt>
								</Label>
								<RadioGroup
									className="flex gap-4"
									onValueChange={(value) =>
										setDiaperType(value as 'urine' | 'stool')
									}
									value={diaperType}
								>
									<div className="flex items-center space-x-2">
										<RadioGroupItem
											className="text-yellow-500 border-yellow-500"
											id="edit-urine"
											value="urine"
										/>
										<Label className="text-yellow-700" htmlFor="edit-urine">
											<span className="text-lg mr-1">💧</span>{' '}
											<fbt desc="Label on a radio button that sets the input to urine only">
												Urine Only
											</fbt>
										</Label>
									</div>
									<div className="flex items-center space-x-2">
										<RadioGroupItem
											className="text-amber-700 border-amber-700"
											id="edit-stool"
											value="stool"
										/>
										<Label className="text-amber-800" htmlFor="edit-stool">
											<span className="text-lg mr-1">💩</span>{' '}
											<fbt desc="Label on a radio button that sets the input to urine and stool">
												Stool
											</fbt>
										</Label>
									</div>
								</RadioGroup>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="edit-date">
										<fbt common>Date</fbt>
									</Label>
									<Input
										id="edit-date"
										onChange={(e) => setDate(e.target.value)}
										type="date"
										value={date}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="edit-time">
										<fbt common>Time</fbt>
									</Label>
									<Input
										id="edit-time"
										onChange={(e) => setTime(e.target.value)}
										type="time"
										value={time}
									/>
								</div>
							</div>
						</>
					)}

					{/* Diaper brand first */}
					<div className="space-y-2">
						<Label htmlFor="edit-diaper-brand">
							<fbt desc="Label on a select that allows the user to pick a diaper brand">
								Diaper Brand
							</fbt>
						</Label>
						<Select onValueChange={setDiaperBrand} value={diaperBrand}>
							<SelectTrigger>
								<SelectValue
									placeholder={
										<fbt desc="Placeholder text on a select that allows the user to pick a diaper brand">
											Select Diaper Brand
										</fbt>
									}
								/>
							</SelectTrigger>
							<SelectContent>
								{DIAPER_BRANDS.map((brand) => (
									<SelectItem key={brand.value} value={brand.value}>
										{brand.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Temperature second */}
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
							onChange={(e) => setTemperature(e.target.value)}
							placeholder={fbt(
								'e.g. 37.2',
								'Placeholder text for an input to set the body temperature in degree Celsius',
							)}
							step="0.1"
							type="number"
							value={temperature}
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

					{/* Leakage and abnormalities last */}
					<div className="flex items-center space-x-2">
						<Switch
							checked={hasLeakage}
							id="edit-leakage"
							onCheckedChange={setHasLeakage}
						/>
						<Label htmlFor="edit-leakage">
							<fbt desc="Label for a switch button that indicates that a diaper has leaked">
								Diaper leaked
							</fbt>
						</Label>
					</div>

					<div className="space-y-2">
						<Label htmlFor="edit-abnormalities">
							<fbt desc="Label for a textbox to note any abnormalities">
								Abnormalities
							</fbt>
						</Label>
						<Textarea
							id="edit-abnormalities"
							onChange={(e) => setAbnormalities(e.target.value)}
							placeholder={fbt(
								'e.g. redness, rash, etc.',
								'Placeholder text for a textbox to note any abnormalities',
							)}
							value={abnormalities}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button onClick={onClose} variant="outline">
						<fbt common>Cancel</fbt>
					</Button>
					<Button onClick={handleSubmit}>
						<fbt common>Save</fbt>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function dateToDateString(date: Date): string {
	return date.toISOString().split('T')[0];
}

function dateToTimeString(date: Date): string {
	return date.toISOString().split('T')[1].slice(0, 5);
}
