import type { Content, Store } from 'tinybase';
import type { JoinStrategy } from '@/contexts/data-synchronization-context';
import { mergeStoreContent } from './merge';
import {
	isStoreDataEmpty,
	snapshotStoreContentIfNonEmpty,
} from './store-utils';

export { snapshotStoreContentIfNonEmpty };

type RemoteBootstrapDecision =
	| 'keep-empty'
	| 'keep-remote'
	| 'restore-local'
	| 'merge';

interface RemoteBootstrapResult {
	decision: RemoteBootstrapDecision;
	localHadData: boolean;
	remoteHadData: boolean;
}

export function reconcileRemoteLoadResult(
	store: Store,
	localSnapshot: Content | undefined,
	strategy: JoinStrategy = 'overwrite',
	deviceId?: string,
): RemoteBootstrapResult {
	const remoteHadData = !isStoreDataEmpty(store);
	const localHadData = localSnapshot !== undefined;

	if (strategy === 'clear') {
		return {
			decision: 'keep-remote',
			localHadData,
			remoteHadData,
		};
	}

	if (strategy === 'merge' && localSnapshot && deviceId) {
		mergeStoreContent(store, localSnapshot, deviceId);
		return {
			decision: 'merge',
			localHadData,
			remoteHadData,
		};
	}

	if (localHadData && !remoteHadData) {
		store.setContent(localSnapshot);
		return {
			decision: 'restore-local',
			localHadData,
			remoteHadData,
		};
	}

	if (remoteHadData) {
		return {
			decision: 'keep-remote',
			localHadData,
			remoteHadData,
		};
	}

	return {
		decision: 'keep-empty',
		localHadData,
		remoteHadData,
	};
}
