import { atom } from 'jotai/vanilla';
import { diapersAtom } from './diapers-atom';

export const lastUsedDiaperBrandAtom = atom((get) => {
	const diaperChanges = get(diapersAtom);
	const latestDiaperChange = diaperChanges[0];
	return latestDiaperChange?.diaperBrand;
});
