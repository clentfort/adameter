import type { Content, Store } from 'tinybase';
import { isStoreDataEmpty } from './legacy-yjs-migration';

type RemoteBootstrapDecision = 'keep-empty' | 'keep-remote' | 'restore-local';

interface RemoteBootstrapResult {
	decision: RemoteBootstrapDecision;
	localHadData: boolean;
	remoteHadData: boolean;
}

export function snapshotStoreContentIfNonEmpty(
	store: Store,
): Content | undefined {
	if (isStoreDataEmpty(store)) {
		return undefined;
	}

	const content = store.getContent();
	if (typeof structuredClone === 'function') {
		return structuredClone(content);
	}

	return content;
}

export function reconcileRemoteLoadResult(
	store: Store,
	localSnapshot: Content | undefined,
): RemoteBootstrapResult {
	const remoteHadData = !isStoreDataEmpty(store);
	const localHadData = localSnapshot !== undefined;

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
