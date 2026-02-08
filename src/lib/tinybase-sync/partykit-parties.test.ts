import { describe, expect, it } from 'vitest';
import {
	isTinybasePartykitParty,
	LEGACY_YJS_PARTYKIT_PARTY,
	TINYBASE_PARTYKIT_PARTY,
} from './partykit-parties';

describe('partykit parties', () => {
	it('keeps Tinybase and legacy Yjs on distinct parties', () => {
		expect(TINYBASE_PARTYKIT_PARTY).not.toBe(LEGACY_YJS_PARTYKIT_PARTY);
		expect(TINYBASE_PARTYKIT_PARTY).toBe('tinybase');
		expect(LEGACY_YJS_PARTYKIT_PARTY).toBe('main');
	});

	it('detects tinybase party names correctly', () => {
		expect(isTinybasePartykitParty(TINYBASE_PARTYKIT_PARTY)).toBe(true);
		expect(isTinybasePartykitParty(LEGACY_YJS_PARTYKIT_PARTY)).toBe(false);
		expect(isTinybasePartykitParty('custom-room')).toBe(false);
	});
});
