import { Doc } from 'yjs';

export const SHARED_TYPES = [
	{ name: 'diaper-changes-dec', type: 'array' },
	{ name: 'events-dec', type: 'array' },
	{ name: 'feeding-sessions-dec', type: 'array' },
	{ name: 'growth-measurments-dec', type: 'array' },
	{ name: 'feeding-in-progress-dec', type: 'map' },
	{ name: 'medication-regimens-dec', type: 'array' },
	{ name: 'medications-dec', type: 'array' },
] as const;

export function hasData(doc: Doc) {
	for (const { name, type } of SHARED_TYPES) {
		if (type === 'array') {
			if (doc.getArray(name).length > 0) {
				return true;
			}
		} else if (type === 'map') {
			const map = doc.getMap(name);
			if (map.size > 0) {
				// Special case for feeding-in-progress-dec which always has a 'current' key
				if (name === 'feeding-in-progress-dec') {
					const current = map.get('current');
					if (current !== null && current !== undefined) {
						return true;
					}
				} else {
					return true;
				}
			}
		}
	}
	return false;
}
