import { useTeeth } from '@/hooks/use-teeth';
import { Tooth } from '@/types/tooth';

const teethLayout = {
	upper: [
		{ id: 'upper-right-central-incisor', name: 'Upper Right Central Incisor' },
		{ id: 'upper-right-lateral-incisor', name: 'Upper Right Lateral Incisor' },
		{ id: 'upper-right-canine', name: 'Upper Right Canine' },
		{ id: 'upper-right-first-molar', name: 'Upper Right First Molar' },
		{ id: 'upper-right-second-molar', name: 'Upper Right Second Molar' },
		{ id: 'upper-left-central-incisor', name: 'Upper Left Central Incisor' },
		{ id: 'upper-left-lateral-incisor', name: 'Upper Left Lateral Incisor' },
		{ id: 'upper-left-canine', name: 'Upper Left Canine' },
		{ id: 'upper-left-first-molar', name: 'Upper Left First Molar' },
		{ id: 'upper-left-second-molar', name: 'Upper Left Second Molar' },
	],
	lower: [
		{ id: 'lower-right-central-incisor', name: 'Lower Right Central Incisor' },
		{ id: 'lower-right-lateral-incisor', name: 'Lower Right Lateral Incisor' },
		{ id: 'lower-right-canine', name: 'Lower Right Canine' },
		{ id: 'lower-right-first-molar', name: 'Lower Right First Molar' },
		{ id: 'lower-right-second-molar', name: 'Lower Right Second Molar' },
		{ id: 'lower-left-central-incisor', name: 'Lower Left Central Incisor' },
		{ id: 'lower-left-lateral-incisor', name: 'Lower Left Lateral Incisor' },
		{ id: 'lower-left-canine', name: 'Lower Left Canine' },
		{ id: 'lower-left-first-molar', name: 'Lower Left First Molar' },
		{ id: 'lower-left-second-molar', name: 'Lower Left Second Molar' },
	],
};

export default function TeethChart() {
	const { value: teeth } = useTeeth();

	const eruptedTeeth = teeth.reduce(
		(acc, tooth) => {
			acc[tooth.name] = tooth;
			return acc;
		},
		{} as Record<string, Tooth>,
	);

	const renderTooth = (tooth: { id: string; name: string }) => {
		const isErupted = eruptedTeeth[tooth.name];
		return (
			<div
				key={tooth.id}
				className={`w-8 h-12 border-2 ${
					isErupted ? 'bg-white' : 'bg-gray-300'
				} rounded-t-lg`}
			>
				{isErupted && (
					<div className="text-xs text-center">
						{new Date(isErupted.eruptionDate!).toLocaleDateString()}
					</div>
				)}
			</div>
		);
	};

	if (teeth.length === 0) {
		return (
			<p className="text-muted-foreground text-center py-4">
				<fbt desc="Info message that no teeth data has been recorded yet">
					No teeth recorded yet.
				</fbt>
			</p>
		);
	}

	return (
		<div className="flex flex-col items-center">
			<div className="flex space-x-1">
				{teethLayout.upper.map(renderTooth)}
			</div>
			<div className="flex space-x-1 mt-4">
				{teethLayout.lower.map(renderTooth)}
			</div>
		</div>
	);
}