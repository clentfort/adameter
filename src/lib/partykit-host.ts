const PARTYKIT_PROJECT_NAME = 'adameter-party';
const PARTYKIT_ACCOUNT = 'clentfort';
const PARTYKIT_DOMAIN_SUFFIX = 'partykit.dev';

interface ResolvePartykitHostOptions {
	explicitHost?: string;
	vercelEnv?: string;
	vercelGitCommitRef?: string;
}

export function resolvePartykitHost({
	explicitHost,
	vercelEnv,
	vercelGitCommitRef,
}: ResolvePartykitHostOptions = {}) {
	if (explicitHost) {
		return normalizePartykitHost(explicitHost);
	}

	const previewName =
		vercelEnv === 'preview' ? getPreviewName(vercelGitCommitRef) : undefined;
	if (previewName) {
		return [
			previewName,
			PARTYKIT_PROJECT_NAME,
			PARTYKIT_ACCOUNT,
			PARTYKIT_DOMAIN_SUFFIX,
		].join('.');
	}

	return [PARTYKIT_PROJECT_NAME, PARTYKIT_ACCOUNT, PARTYKIT_DOMAIN_SUFFIX].join(
		'.',
	);
}

export function getPartykitHostFromEnv(env: NodeJS.ProcessEnv = process.env) {
	return resolvePartykitHost({
		explicitHost: env.NEXT_PUBLIC_PARTYKIT_HOST,
		vercelEnv: env.VERCEL_ENV,
		vercelGitCommitRef: env.VERCEL_GIT_COMMIT_REF,
	});
}

const NEXT_PUBLIC_PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST;

export const PARTYKIT_HOST = resolvePartykitHost({
	explicitHost: NEXT_PUBLIC_PARTYKIT_HOST,
	vercelEnv: process.env.VERCEL_ENV,
	vercelGitCommitRef: process.env.VERCEL_GIT_COMMIT_REF,
});
export const PARTYKIT_URL = `https://${PARTYKIT_HOST}`;

function normalizePartykitHost(host: string) {
	return host.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function getPreviewName(vercelGitCommitRef?: string) {
	if (!vercelGitCommitRef) {
		return undefined;
	}

	return `branch-${normalizePreviewId(vercelGitCommitRef, 56)}`;
}

function normalizePreviewId(value: string, maxLength: number) {
	const normalized = value
		.toLowerCase()
		.replaceAll(/[^\da-z]+/g, '-')
		.replaceAll(/^-+|-+$/g, '')
		.replaceAll(/-+/g, '-');

	if (!normalized) {
		return 'preview';
	}

	return normalized.slice(0, maxLength).replaceAll(/-+$/g, '') || 'preview';
}
