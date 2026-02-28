import { execSync } from 'node:child_process';
import { NextConfig } from 'next';

const PARTYKIT_PROJECT_NAME = 'adameter-party';
const PARTYKIT_ACCOUNT = 'clentfort';

const hasPartykitChanges = () => {
	try {
		execSync('git fetch origin main --depth=1', { stdio: 'ignore' });
		const diff = execSync('git diff --name-only origin/main...HEAD', {
			encoding: 'utf8',
		});
		return diff
			.split('\n')
			.some(
				(file) =>
					file.startsWith('party/') ||
					file === 'package.json' ||
					file === 'partykit.json' ||
					file === 'pnpm-lock.yaml',
			);
	} catch {
		return false;
	}
};

const getPartykitHostForBuild = () => {
	const explicitHost = process.env.NEXT_PUBLIC_PARTYKIT_HOST;
	if (explicitHost) {
		return explicitHost.replace(/^https?:\/\//, '').replace(/\/$/, '');
	}

	const vercelEnv = process.env.VERCEL_ENV;
	if (vercelEnv === 'preview') {
		const prId = process.env.VERCEL_GIT_PULL_REQUEST_ID;
		if (prId && hasPartykitChanges()) {
			return `pr-${prId}.${PARTYKIT_PROJECT_NAME}.${PARTYKIT_ACCOUNT}.partykit.dev`;
		}
		return `preview.${PARTYKIT_PROJECT_NAME}.${PARTYKIT_ACCOUNT}.partykit.dev`;
	}

	return `${PARTYKIT_PROJECT_NAME}.${PARTYKIT_ACCOUNT}.partykit.dev`;
};

const getGitCommit = () => {
	try {
		return execSync('git rev-parse --short HEAD').toString().trim();
	} catch {
		return 'unknown';
	}
};

const nextConfig: NextConfig = {
	env: {
		NEXT_PUBLIC_GIT_COMMIT: getGitCommit(),
		NEXT_PUBLIC_PARTYKIT_HOST: getPartykitHostForBuild(),
	},
	eslint: {
		// Warning: This allows production builds to successfully complete even if
		// your project has ESLint errors.
		ignoreDuringBuilds: true,
	},
	productionBrowserSourceMaps: true,
	typescript: {
		// Warning: This allows production builds to successfully complete even if
		// your project has TypeScript errors.
		ignoreBuildErrors: true,
	},
};

export default nextConfig;
