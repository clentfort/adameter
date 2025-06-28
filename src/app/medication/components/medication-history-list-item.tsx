'use client';

import { format } from 'date-fns';
import { fbt } from 'fbtee';
import {
	Bell,
	BellOff,
	CalendarDays,
	Edit2,
	Pill,
	Trash2,
	User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Medication } from '@/types/medication';
import '@/i18n';

interface MedicationHistoryListItemProps {
	item: Medication;
	onDelete: (id: string) => void;
	onEdit: (item: Medication) => void;
}

export default function MedicationHistoryListItem({
	item,
	onDelete,
	onEdit,
}: MedicationHistoryListItemProps) {
	const {
		dosage,
		endDate,
		id,
		name,
		notes,
		notificationsEnabled,
		prescriberName,
		prescriberType,
		startDate,
		timeOfDay,
	} = item;

	const formattedStartDate = format(new Date(startDate), 'PPP');
	const formattedEndDate = endDate ? (
		format(new Date(endDate), 'PPP')
	) : (
		<fbt desc="Indicator for ongoing medication">Ongoing</fbt>
	);

	const getPrescriberDisplay = () => {
		switch (prescriberType) {
			case 'doctor':
				return prescriberName
					? `${fbt('Doctor', 'Prescriber type doctor')}: ${prescriberName}`
					: fbt('Doctor', 'Prescriber type doctor');
			case 'self':
				return <fbt desc="Prescriber type self">Self-Prescribed</fbt>;
			case 'other':
				return prescriberName
					? `${fbt('Other', 'Prescriber type other')}: ${prescriberName}`
					: fbt('Other', 'Prescriber type other');
			default:
				return '';
		}
	};

	return (
		<Card>
			<CardHeader className="pb-2">
				<div className="flex justify-between items-start">
					<CardTitle className="text-lg flex items-center">
						<Pill className="mr-2 h-5 w-5 text-blue-500" />
						{name}
					</CardTitle>
					<div className="flex space-x-1">
						<Button onClick={() => onEdit(item)} size="icon" variant="ghost">
							<Edit2 className="h-4 w-4" />
						</Button>
						<Button
							className="text-red-500 hover:text-red-600"
							onClick={() => onDelete(id)}
							size="icon"
							variant="ghost"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</div>
				<div className="text-sm text-muted-foreground">{dosage}</div>
			</CardHeader>
			<CardContent className="text-sm space-y-2">
				<div className="flex items-center">
					<CalendarDays className="mr-2 h-4 w-4 text-gray-500" />
					<span>
						{formattedStartDate} - {formattedEndDate}
					</span>
				</div>
				<div className="flex items-center">
					<User className="mr-2 h-4 w-4 text-gray-500" />
					<span>{getPrescriberDisplay()}</span>
				</div>
				{timeOfDay && (
					<div className="flex items-center">
						{notificationsEnabled ? (
							<Bell className="mr-2 h-4 w-4 text-green-500" />
						) : (
							<BellOff className="mr-2 h-4 w-4 text-red-500" />
						)}
						<span>
							<fbt desc="Label for time of day of medication">Time:</fbt>{' '}
							{timeOfDay}
							{notificationsEnabled ? (
								<Badge
									className="ml-2 bg-green-100 text-green-700 border-green-300"
									variant="outline"
								>
									<fbt desc="Indicator that reminders are on">Reminders ON</fbt>
								</Badge>
							) : (
								<Badge
									className="ml-2 bg-red-100 text-red-700 border-red-300"
									variant="outline"
								>
									<fbt desc="Indicator that reminders are off">
										Reminders OFF
									</fbt>
								</Badge>
							)}
						</span>
					</div>
				)}
				{!timeOfDay && (
					<div className="flex items-center">
						<BellOff className="mr-2 h-4 w-4 text-gray-500" />
						<span>
							<fbt desc="Indicator that no time is set for reminders">
								No reminder time set
							</fbt>
						</span>
					</div>
				)}
				{notes && (
					<div className="pt-1">
						<p className="text-xs text-gray-600 whitespace-pre-wrap">
							<strong>
								<fbt desc="Label for notes section">Notes:</fbt>
							</strong>{' '}
							{notes}
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
