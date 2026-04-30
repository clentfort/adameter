import type { Row } from 'tinybase';
import type { Profile } from '@/types/profile';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeProfileForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { profileSchema } from '@/types/profile';
import { createEntityHooks } from './create-entity-hooks';
import { useSelectedProfileId } from './use-selected-profile-id';

function toProfile(id: string, row: Row): Profile | null {
	const result = profileSchema.safeParse({
		...row,
		id,
	});

	if (!result.success) {
		// eslint-disable-next-line no-console
		console.warn(`Invalid profile data for id ${id}:`, result.error.issues);
		return null;
	}

	return result.data;
}

const profileHooks = createEntityHooks<Profile>({
	sanitize: sanitizeProfileForStore,
	tableId: TABLE_IDS.PROFILES,
	toEntity: toProfile,
});

export const useUpsertProfile = profileHooks.useUpsert;
export const useRemoveProfile = profileHooks.useRemove;
export const useProfilesSnapshot = profileHooks.useSnapshot;
export const useProfileIds = profileHooks.useIds;

export const useProfile = () => {
	const [selectedProfileId] = useSelectedProfileId();
	const profile = profileHooks.useOne(selectedProfileId);

	return [profile ?? null] as const;
};
