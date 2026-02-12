import { fbt } from 'fbtee';

/**
 * Returns the human-readable name of a tooth based on its FDI number.
 * FDI numbers for primary teeth are:
 * 51-55 (Upper Right)
 * 61-65 (Upper Left)
 * 71-75 (Lower Left)
 * 81-85 (Lower Right)
 */
export function getToothName(toothId: number): string {
	const quadrant = Math.floor(toothId / 10);
	const position = toothId % 10;

	let quadrantName = '';
	switch (quadrant) {
		case 5:
			quadrantName = fbt('Upper Right', 'Quadrant name');
			break;
		case 6:
			quadrantName = fbt('Upper Left', 'Quadrant name');
			break;
		case 7:
			quadrantName = fbt('Lower Left', 'Quadrant name');
			break;
		case 8:
			quadrantName = fbt('Lower Right', 'Quadrant name');
			break;
	}

	let positionName = '';
	switch (position) {
		case 1:
			positionName = fbt('Central Incisor', 'Tooth position name');
			break;
		case 2:
			positionName = fbt('Lateral Incisor', 'Tooth position name');
			break;
		case 3:
			positionName = fbt('Canine', 'Tooth position name');
			break;
		case 4:
			positionName = fbt('First Molar', 'Tooth position name');
			break;
		case 5:
			positionName = fbt('Second Molar', 'Tooth position name');
			break;
	}

	return `${quadrantName} ${positionName}`;
}
