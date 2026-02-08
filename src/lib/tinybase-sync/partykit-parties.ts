export const LEGACY_YJS_PARTYKIT_PARTY = 'main';
export const TINYBASE_PARTYKIT_PARTY = 'tinybase';

export function isTinybasePartykitParty(partyName: string) {
	return partyName === TINYBASE_PARTYKIT_PARTY;
}
