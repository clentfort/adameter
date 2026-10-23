export const PRODUCTION_PARTYKIT_HOST = 'adameter-party.adameter.workers.dev';
export const PREVIEW_PARTYKIT_HOST =
	'adameter-party-preview.adameter.workers.dev';

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

export const PARTYKIT_HOST = getPartykitHostFromEnv();

function normalizePartykitHost(host: string) {
	return host.replace(/^https?:\/\//, '').replace(/\/$/, '');
}
