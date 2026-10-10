export const PRODUCTION_PARTYKIT_HOST = 'adameter-party.adameter.workers.dev';
export const PREVIEW_PARTYKIT_HOST =
	'adameter-party-preview.adameter.workers.dev';

// Retired managed PartyKit hosts. Clients read them once more to migrate room
// snapshots; the platform deletes all data on 2026-10-23.
export const LEGACY_PRODUCTION_PARTYKIT_HOST =
	'adameter-party.clentfort.partykit.dev';
export const LEGACY_PREVIEW_PARTYKIT_HOST =
	'preview.adameter-party.clentfort.partykit.dev';

const LEGACY_HOSTS: Record<string, string> = {
	[PREVIEW_PARTYKIT_HOST]: LEGACY_PREVIEW_PARTYKIT_HOST,
	[PRODUCTION_PARTYKIT_HOST]: LEGACY_PRODUCTION_PARTYKIT_HOST,
};

interface ResolvePartykitHostOptions {
	explicitHost?: string;
	vercelEnv?: string;
}

export function resolvePartykitHost({
	explicitHost,
	vercelEnv,
}: ResolvePartykitHostOptions = {}) {
	if (explicitHost) {
		return normalizePartykitHost(explicitHost);
	}

	return vercelEnv === 'preview'
		? PREVIEW_PARTYKIT_HOST
		: PRODUCTION_PARTYKIT_HOST;
}

export function getPartykitHostFromEnv(env: NodeJS.ProcessEnv = process.env) {
	return resolvePartykitHost({
		explicitHost: env.NEXT_PUBLIC_PARTYKIT_HOST,
		vercelEnv: env.VERCEL_ENV,
	});
}

/**
 * Returns the managed PartyKit host that served the same rooms before the
 * move to Cloudflare, or `undefined` when there is none (e.g. local dev).
 */
export function resolveLegacyPartykitHost(
	host: string,
	explicitLegacyHost?: string,
): string | undefined {
	if (explicitLegacyHost) {
		return normalizePartykitHost(explicitLegacyHost);
	}
	return LEGACY_HOSTS[host];
}

export const PARTYKIT_HOST = resolvePartykitHost({
	explicitHost: process.env.NEXT_PUBLIC_PARTYKIT_HOST,
	vercelEnv: process.env.VERCEL_ENV,
});
export const PARTYKIT_URL = `https://${PARTYKIT_HOST}`;

export const LEGACY_PARTYKIT_HOST = resolveLegacyPartykitHost(
	PARTYKIT_HOST,
	process.env.NEXT_PUBLIC_LEGACY_PARTYKIT_HOST,
);

function normalizePartykitHost(host: string) {
	return host.replace(/^https?:\/\//, '').replace(/\/$/, '');
}
