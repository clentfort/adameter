'use client';

import type { MedicationAdministration } from '@/types/medication';
import { fbt } from 'fbtee';
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
import { Textarea } from '@/components/ui/textarea';
import { useMedicationAdministrations } from '@/hooks/use-medication-administrations';
import { useMedicationRegimens } from '@/hooks/use-medication-regimens';
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';
import { getDeviceId } from '@/utils/device-id';

interface MedicationAdministrationFormProps {
	admin?: MedicationAdministration;
	onClose: () => void;
	onSave: (admin: MedicationAdministration) => void;
}

const COMMON_UNITS = ['ml', 'mg', 'drop', 'pill', 'spray', 'g'];

export default function MedicationAdministrationForm({
	admin,
	onClose,
	onSave,
}: MedicationAdministrationFormProps) {
	const { value: regimens } = useMedicationRegimens();
	const { value: history } = useMedicationAdministrations();

	const [name, setName] = useState(admin?.name ?? '');
	const [dosage, setDosage] = useState(admin?.dosage ?? '');
	const [unit, setUnit] = useState(admin?.unit ?? '');
	const [prescribedBy, setPrescribedBy] = useState(admin?.prescribedBy ?? '');
	const [timestamp, setTimestamp] = useState(
		admin?.timestamp
			? new Date(admin.timestamp).toISOString().slice(0, 16)
			: new Date().toISOString().slice(0, 16),
	);
	const [note, setNote] = useState(admin?.note ?? '');

	const medicationNames = Array.from(
		new Set([
			...regimens.map((r) => r.name),
			...history.map((h) => h.name),
		]),
	);

	const units = Array.from(
		new Set([...COMMON_UNITS, ...history.map((h) => h.unit)]),
	);

	const handleSave = () => {
		if (!name || !dosage || !unit) {
			return;
		}

		onSave({
			deviceId: getDeviceId(),
			dosage,
			id: admin?.id ?? crypto.randomUUID(),
			name,
			note: note || undefined,
			prescribedBy: prescribedBy || undefined,
			status: 'administered',
			timestamp: new Date(timestamp).toISOString(),
			unit,
		});
	};

	return (
		<Dialog onOpenChange={(open) => !open && onClose()} open={true}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>
						{admin ? (
							<fbt desc="Title for editing a medication administration">
								Edit Administration
							</fbt>
						) : (
							<fbt desc="Title for adding a medication administration">
								Add Entry
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
							list="medication-names"
							onChange={(e) => {
								setName(e.target.value);
								// If user selects a known regimen, pre-fill details
								const regimen = regimens.find((r) => r.name === e.target.value);
								if (regimen) {
									setDosage(regimen.dosage);
									setUnit(regimen.unit);
									if (regimen.prescribedBy) {
										setPrescribedBy(regimen.prescribedBy);
									}
								}
							}}
							placeholder={fbt(
								'e.g. Ibuprofen',
								'Placeholder for medication name',
							)}
							value={name}
						/>
						<datalist id="medication-names">
							{medicationNames.map((n) => (
								<option key={n} value={n} />
							))}
						</datalist>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="dosage">
								<fbt desc="Label for dosage input">Dosage</fbt>
							</Label>
							<Input
								id="dosage"
								onChange={(e) => setDosage(e.target.value)}
								placeholder="e.g. 2.5"
								value={dosage}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="unit">
								<fbt common>Unit</fbt>
							</Label>
							<Input
								id="unit"
								list="medication-units"
								onChange={(e) => setUnit(e.target.value)}
								placeholder="e.g. ml"
								value={unit}
							/>
							<datalist id="medication-units">
								{units.map((u) => (
									<option key={u} value={u} />
								))}
							</datalist>
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
						<Label htmlFor="timestamp">
							<fbt common>Time</fbt>
						</Label>
						<Input
							id="timestamp"
							onChange={(e) => setTimestamp(e.target.value)}
							type="datetime-local"
							value={timestamp}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="note">
							<fbt desc="Label for optional note">Note</fbt> (optional)
						</Label>
						<Textarea
							id="note"
							onChange={(e) => setNote(e.target.value)}
							placeholder={fbt('Reason for giving, symptoms, etc.', 'Placeholder for medication note')}
							value={note}
						/>
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
