import type { DiaperChange } from '@/types/diaper';
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';
import { dateToTimeInputValue } from '@/utils/date-to-time-input-value';
import { DIAPER_BRANDS } from '../utils/diaper-brands';
import { isAbnormalTemperature } from '../utils/is-abnormal-temperature';

export interface AddDiaperProps {
	onClose: () => void;
	onSave: (change: DiaperChange) => void;
	presetDiaperBrand?: string;
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
	const [date, setDate] = useState(
		'change' in props
			? dateToDateInputValue(props.change.timestamp)
			: dateToDateInputValue(new Date()),
	);
	const [time, setTime] = useState(
		'change' in props
			? dateToTimeInputValue(props.change.timestamp)
			: dateToTimeInputValue(new Date()),
	);
	const [containsUrine, setContainsUrine] = useState(
		'change' in props
			? props.change.containsUrine
			: props.presetType === undefined ||
					props.presetType === 'urine' ||
					props.presetType === 'stool',
	);
	const [containsStool, setContainsStool] = useState(
		'change' in props
			? props.change.containsStool
			: props.presetType === 'stool',
	);
	const [pottyUrine, setPottyUrine] = useState(
		'change' in props ? (props.change.pottyUrine ?? false) : false,
	);
	const [pottyStool, setPottyStool] = useState(
		'change' in props ? (props.change.pottyStool ?? false) : false,
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
		setDate(dateToDateInputValue(changeDate));
		setTime(dateToTimeInputValue(changeDate));
		setContainsUrine(change.containsUrine);
		setContainsStool(change.containsStool);
		setPottyUrine(change.pottyUrine ?? false);
		setPottyStool(change.pottyStool ?? false);

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
			containsStool,
			containsUrine,
			diaperBrand: diaperBrand || undefined,
			id: change?.id || Date.now().toString(),
			leakage: hasLeakage || undefined,
			pottyStool,
			pottyUrine,
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
								onClick={() => setContainsUrine(!containsUrine)}
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
								onClick={() => setContainsStool(!containsStool)}
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
								onClick={() => setPottyUrine(!pottyUrine)}
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
								onClick={() => setPottyStool(!pottyStool)}
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
								onCheckedChange={setHasLeakage}
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

					<div className="space-y-2">
						<Label htmlFor="edit-notes">
							<fbt desc="Label for a textbox to note any notes">Notes</fbt>
						</Label>
						<Textarea
							id="edit-notes"
							onChange={(e) => setAbnormalities(e.target.value)}
							placeholder={fbt(
								'e.g. redness, rash, etc.',
								'Placeholder text for a textbox to note any notes',
							)}
							value={abnormalities}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button onClick={onClose} variant="outline">
						<fbt common>Cancel</fbt>
					</Button>
					<Button data-testid="save-button" onClick={handleSubmit}>
						<fbt common>Save</fbt>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
