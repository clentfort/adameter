import { NextConfig } from 'next';

const PARTYKIT_PROJECT_NAME = 'adameter-party';
const PARTYKIT_ACCOUNT = 'clentfort';

const getPartykitHostForBuild = () => {
	const explicitHost = process.env.NEXT_PUBLIC_PARTYKIT_HOST;
	if (explicitHost) {
		return explicitHost.replace(/^https?:\/\//, '').replace(/\/$/, '');
	}

	const vercelEnv = process.env.VERCEL_ENV;
	const vercelGitCommitRef = process.env.VERCEL_GIT_COMMIT_REF;
	const previewName =
		vercelEnv === 'preview' ? getPreviewName(vercelGitCommitRef) : undefined;
	if (previewName) {
		return `${previewName}.${PARTYKIT_PROJECT_NAME}.${PARTYKIT_ACCOUNT}.partykit.dev`;
	}

	return `${PARTYKIT_PROJECT_NAME}.${PARTYKIT_ACCOUNT}.partykit.dev`;
};

const getPreviewName = (vercelGitCommitRef?: string) => {
	if (!vercelGitCommitRef) {
		return undefined;
	}

	return `branch-${normalizePreviewId(vercelGitCommitRef, 56)}`;
};

const normalizePreviewId = (value: string, maxLength: number) => {
	const normalized = value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/-+/g, '-');

	if (!normalized) {
		return 'preview';
	}

	return normalized.slice(0, maxLength).replace(/-+$/g, '') || 'preview';
};

const nextConfig: NextConfig = {
	env: {
		NEXT_PUBLIC_PARTYKIT_HOST: getPartykitHostForBuild(),
	},
	eslint: {
		// Warning: This allows production builds to successfully complete even if
		// your project has ESLint errors.
		ignoreDuringBuilds: true,
	},
	productionBrowserSourceMaps: true,
	serverExternalPackages: ['yjs'],
	typescript: {
		// Warning: This allows production builds to successfully complete even if
		// your project has TypeScript errors.
		ignoreBuildErrors: true,
	},
};

export default nextConfig;
