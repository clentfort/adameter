import {
	useCallback,
	useContext,
	useEffect,
	useSyncExternalStore,
} from 'react';
import { useRowIds, useSetValueCallback, useValue } from 'tinybase/ui-react';
import { DataSynchronizationContext } from '@/contexts/data-synchronization-context';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import {
	STORE_VALUE_SELECTED_PROFILE_ID,
	TABLE_IDS,
} from '@/lib/tinybase-sync/constants';

const SELECTED_PROFILE_CHANGE_EVENT = 'adameter-selected-profile-change';

function getLocallySelectedProfileId() {
	return getItem(STORAGE_KEYS.SELECTED_PROFILE_ID);
}

function subscribeToLocallySelectedProfileId(onStoreChange: () => void) {
	if (typeof window === 'undefined') {
		return () => {};
	}

	const handleChange = () => onStoreChange();
	window.addEventListener('storage', handleChange);
	window.addEventListener(SELECTED_PROFILE_CHANGE_EVENT, handleChange);

	return () => {
		window.removeEventListener('storage', handleChange);
		window.removeEventListener(SELECTED_PROFILE_CHANGE_EVENT, handleChange);
	};
}

function setLocallySelectedProfileId(profileId: string) {
	setItem(STORAGE_KEYS.SELECTED_PROFILE_ID, profileId);
	window.dispatchEvent(new Event(SELECTED_PROFILE_CHANGE_EVENT));
}

export const useSelectedProfileId = () => {
	const { room } = useContext(DataSynchronizationContext);
	const profileIds = useRowIds(TABLE_IDS.PROFILES);
	const legacySelectedProfileId = useValue(STORE_VALUE_SELECTED_PROFILE_ID) as
		string | undefined;
	const locallySelectedProfileId = useSyncExternalStore(
		subscribeToLocallySelectedProfileId,
		getLocallySelectedProfileId,
		() => null,
	);
	const setLegacySelectedProfileId = useSetValueCallback(
		STORE_VALUE_SELECTED_PROFILE_ID,
		(id: string) => id,
		[],
	);

	const isValidProfileId = (profileId: string | null | undefined) =>
		typeof profileId === 'string' && profileIds.includes(profileId);

	const selectedProfileId = isValidProfileId(locallySelectedProfileId)
		? locallySelectedProfileId!
		: !room && typeof legacySelectedProfileId === 'string'
			? legacySelectedProfileId
			: profileIds[0];

	useEffect(() => {
		if (selectedProfileId && locallySelectedProfileId !== selectedProfileId) {
			setLocallySelectedProfileId(selectedProfileId);
		}
	}, [locallySelectedProfileId, selectedProfileId]);

	const setSelectedProfileId = useCallback(
		(profileId: string) => {
			setLocallySelectedProfileId(profileId);
			if (!room) {
				setLegacySelectedProfileId(profileId);
			}
		},
		[room, setLegacySelectedProfileId],
	);

	return [selectedProfileId, setSelectedProfileId] as const;
};
