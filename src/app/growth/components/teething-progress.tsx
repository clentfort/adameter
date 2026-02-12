import type { Tooth } from '@/types/teething';
import { useState } from 'react';
import { useTeething } from '@/hooks/use-teething';
import { cn } from '@/lib/utils';
import { getToothName } from '../utils/teething';
import TeethingForm from './teething-form';

const UPPER_RIGHT = [55, 54, 53, 52, 51];
const UPPER_LEFT = [61, 62, 63, 64, 65];
const LOWER_RIGHT = [85, 84, 83, 82, 81];
const LOWER_LEFT = [71, 72, 73, 74, 75];

export default function TeethingProgress() {
	const { update, value: teeth } = useTeething();
	const [selectedToothId, setSelectedToothId] = useState<number | null>(null);

	const getTooth = (toothId: number): Tooth => {
		return (
			teeth.find((t) => t.toothId === toothId) || {
				id: toothId.toString(),
				toothId,
			}
		);
	};

	const handleSave = (tooth: Tooth) => {
		update(tooth);
	};

	const toothName = selectedToothId ? getToothName(selectedToothId) : '';

	return (
		<div className="flex flex-col items-center space-y-8 py-4">
			<div className="w-full max-w-md text-center space-y-2">
				<p className="text-sm text-muted-foreground">
					<fbt desc="Help text for teething map">
						Looking into the mouth (Dentist&apos;s perspective). Click on a
						tooth to record its eruption date and add notes.
					</fbt>
				</p>
			</div>

			<div className="w-full max-w-md">
				<h3 className="text-center mb-4 font-medium text-muted-foreground">
					<fbt desc="Upper jaw label">Upper Jaw</fbt>
				</h3>
				<div className="grid grid-cols-10 gap-1 sm:gap-2">
					{UPPER_RIGHT.map((id) => (
						<ToothIcon
							key={id}
							onClick={() => setSelectedToothId(id)}
							tooth={getTooth(id)}
						/>
					))}
					{UPPER_LEFT.map((id) => (
						<ToothIcon
							key={id}
							onClick={() => setSelectedToothId(id)}
							tooth={getTooth(id)}
						/>
					))}
				</div>
			</div>

			<div className="w-full max-w-md">
				<div className="grid grid-cols-10 gap-1 sm:gap-2">
					{LOWER_RIGHT.map((id) => (
						<ToothIcon
							key={id}
							onClick={() => setSelectedToothId(id)}
							tooth={getTooth(id)}
						/>
					))}
					{LOWER_LEFT.map((id) => (
						<ToothIcon
							key={id}
							onClick={() => setSelectedToothId(id)}
							tooth={getTooth(id)}
						/>
					))}
				</div>
				<h3 className="text-center mt-4 font-medium text-muted-foreground">
					<fbt desc="Lower jaw label">Lower Jaw</fbt>
				</h3>
			</div>

			{selectedToothId && (
				<TeethingForm
					onClose={() => setSelectedToothId(null)}
					onSave={handleSave}
					tooth={getTooth(selectedToothId)}
					toothName={toothName}
				/>
			)}

			<div className="w-full max-w-md space-y-2 mt-4">
				<h4 className="font-semibold px-1">
					<fbt desc="Legend title">Legend</fbt>
				</h4>
				<div className="flex gap-4 px-1 text-sm">
					<div className="flex items-center gap-1">
						<div className="w-4 h-4 rounded-xs border bg-muted" />
						<span>
							<fbt desc="Not erupted status">Not erupted</fbt>
						</span>
					</div>
					<div className="flex items-center gap-1">
						<div className="w-4 h-4 rounded-xs border bg-primary" />
						<span>
							<fbt desc="Erupted status">Erupted</fbt>
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

function ToothIcon({ onClick, tooth }: { onClick: () => void; tooth: Tooth }) {
	const isErupted = !!tooth.date;
	const isUpper = tooth.toothId >= 50 && tooth.toothId <= 69;

	return (
		<button
			className={cn(
				'aspect-square flex flex-col items-center justify-center text-[10px] sm:text-xs font-bold rounded-t-lg rounded-b-lg border-2 transition-colors',
				isErupted
					? 'bg-primary text-primary-foreground border-primary'
					: 'bg-muted text-muted-foreground border-transparent hover:border-muted-foreground/30',
				isUpper ? 'rounded-b-sm' : 'rounded-t-sm',
			)}
			onClick={onClick}
			type="button"
		>
			<span>{tooth.toothId}</span>
		</button>
	);
}
