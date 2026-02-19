import type {
	MedicationRegimen,
	MedicationRegimenType,
} from '@/types/medication';
import { fbt } from 'fbtee';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
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
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';

interface MedicationRegimenFormProps {
	onClose: () => void;
	onSave: (regimen: MedicationRegimen) => void;
	regimen?: MedicationRegimen;
}

export default function MedicationRegimenForm({
	onClose,
	onSave,
	regimen,
}: MedicationRegimenFormProps) {
	const [name, setName] = useState(regimen?.name ?? '');
	const [dosage, setDosage] = useState(regimen?.dosage ?? '');
	const [unit, setUnit] = useState(regimen?.unit ?? '');
	const [prescribedBy, setPrescribedBy] = useState(regimen?.prescribedBy ?? '');
	const [type, setType] = useState<MedicationRegimenType>(
		regimen?.type ?? 'fixed',
	);
	const [times, setTimes] = useState<string[]>(
		regimen?.times ?? ['08:00', '20:00'],
	);
	const [intervalHours, setIntervalHours] = useState<string>(
		regimen?.intervalHours?.toString() ?? '8',
	);
	const [startDate, setStartDate] = useState(
		dateToDateInputValue(
			regimen?.startDate ? new Date(regimen.startDate) : new Date(),
		),
	);
	const [endDate, setEndDate] = useState(
		regimen?.endDate ? dateToDateInputValue(new Date(regimen.endDate)) : '',
	);

	const handleSave = () => {
		if (!name || !dosage || !unit) {
			return;
		}

		onSave({
			dosage,
			endDate: endDate ? new Date(endDate).toISOString() : undefined,
			id: regimen?.id ?? crypto.randomUUID(),
			intervalHours:
				type === 'interval' ? Number.parseInt(intervalHours, 10) : undefined,
			name,
			prescribedBy: prescribedBy || undefined,
			startDate: new Date(startDate).toISOString(),
			status: 'active',
			times: type === 'fixed' ? times : undefined,
			type,
			unit,
		});
	};

	const addTime = () => setTimes([...times, '12:00']);
	const removeTime = (index: number) =>
		setTimes(times.filter((_, i) => i !== index));
	const updateTime = (index: number, value: string) => {
		const newTimes = [...times];
		newTimes[index] = value;
		setTimes(newTimes);
	};

	return (
		<Dialog onOpenChange={(open) => !open && onClose()} open={true}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>
						{regimen ? (
							<fbt desc="Title for editing a medication regimen">
								Edit Regimen
							</fbt>
						) : (
							<fbt desc="Title for creating a new medication regimen">
								New Regimen
							</fbt>
						)}
					</DialogTitle>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="name">
							<fbt desc="Label for medication name input">Medication Name</fbt>
						</Label>
						<Input
							id="name"
							onChange={(e) => setName(e.target.value)}
							placeholder={fbt(
								'e.g. Vitamin D',
								'Placeholder for medication name',
							)}
							value={name}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="dosage">
								<fbt desc="Label for dosage input">Dosage</fbt>
							</Label>
							<Input
								id="dosage"
								onChange={(e) => setDosage(e.target.value)}
								placeholder="e.g. 1"
								value={dosage}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="unit">
								<fbt common>Unit</fbt>
							</Label>
							<Input
								id="unit"
								onChange={(e) => setUnit(e.target.value)}
								placeholder="e.g. drop"
								value={unit}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="prescribedBy">
							<fbt desc="Label for who prescribed the medication">
								Prescribed By
							</fbt>{' '}
							(optional)
						</Label>
						<Input
							id="prescribedBy"
							onChange={(e) => setPrescribedBy(e.target.value)}
							placeholder="e.g. Dr. Smith"
							value={prescribedBy}
						/>
					</div>

					<div className="space-y-2">
						<Label>
							<fbt desc="Label for regimen type selection">Schedule Type</fbt>
						</Label>
						<RadioGroup
							className="flex gap-4"
							onValueChange={(v) => setType(v as MedicationRegimenType)}
							value={type}
						>
							<div className="flex items-center space-x-2">
								<RadioGroupItem id="type-fixed" value="fixed" />
								<Label htmlFor="type-fixed">
									<fbt desc="Option for fixed times regimen">Fixed Times</fbt>
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem id="type-interval" value="interval" />
								<Label htmlFor="type-interval">
									<fbt desc="Option for interval based regimen">Interval</fbt>
								</Label>
							</div>
						</RadioGroup>
					</div>

					{type === 'fixed' && (
						<div className="space-y-2">
							<Label>
								<fbt desc="Label for fixed times list">Times</fbt>
							</Label>
							<div className="space-y-2">
								{times.map((time, index) => (
									<div className="flex gap-2" key={index}>
										<Input
											onChange={(e) => updateTime(index, e.target.value)}
											type="time"
											value={time}
										/>
										{times.length > 1 && (
											<Button
												onClick={() => removeTime(index)}
												size="icon"
												variant="ghost"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										)}
									</div>
								))}
								<Button className="w-full" onClick={addTime} variant="outline">
									<Plus className="h-4 w-4 mr-2" />
									<fbt desc="Button to add another time to the schedule">
										Add Time
									</fbt>
								</Button>
							</div>
						</div>
					)}

					{type === 'interval' && (
						<div className="space-y-2">
							<Label htmlFor="interval">
								<fbt desc="Label for interval hours input">Every X Hours</fbt>
							</Label>
							<Input
								id="interval"
								min="1"
								onChange={(e) => setIntervalHours(e.target.value)}
								type="number"
								value={intervalHours}
							/>
						</div>
					)}

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="startDate">
								<fbt desc="Label for regimen start date">Start Date</fbt>
							</Label>
							<Input
								id="startDate"
								onChange={(e) => setStartDate(e.target.value)}
								type="date"
								value={startDate}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="endDate">
								<fbt desc="Label for regimen end date">End Date</fbt> (optional)
							</Label>
							<Input
								id="endDate"
								onChange={(e) => setEndDate(e.target.value)}
								type="date"
								value={endDate}
							/>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button disabled={!name || !dosage || !unit} onClick={handleSave}>
						<fbt common>Save</fbt>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
