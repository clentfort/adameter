import { execSync } from 'node:child_process';
import { NextConfig } from 'next';
import { getPartykitHostFromEnv } from './src/lib/partykit-host';

/**
 * Paths that, when changed, trigger a branch-specific PartyKit deployment.
 * Must stay in sync with .github/workflows/partykit-preview.yaml `paths`.
 */
const PARTYKIT_PATHS = [
	'party/',
	'packages/tinybase-synchronizer-partykit-server-encrypted/',
	'partykit.json',
	'package.json',
	'pnpm-lock.yaml',
];

const hasPartykitChanges = () => {
	try {
		execSync('git fetch origin main --depth=1', { stdio: 'ignore' });
		// Use two-arg form (tree comparison) instead of three-dot syntax
		// (merge-base). Three-dot needs commit history to find the merge base,
		// which fails in Vercel's shallow clone. Two-arg only needs the two
		// tree snapshots which --depth=1 provides.
		const diff = execSync('git diff --name-only origin/main HEAD', {
			encoding: 'utf8',
		});
		return diff
			.split('\n')
			.some((file) =>
				PARTYKIT_PATHS.some((path) =>
					path.endsWith('/') ? file.startsWith(path) : file === path,
				),
			);
	} catch {
		return false;
	}
};

const SHARED_PREVIEW_HOST = 'preview.tristanmeter-party.clentfort.partykit.dev';

const getPartykitHostForBuild = () => {
	const explicitHost = process.env.NEXT_PUBLIC_PARTYKIT_HOST;
	if (explicitHost) {
		return explicitHost.replace(/^https?:\/\//, '').replace(/\/$/, '');
	}

	if (process.env.NODE_ENV === 'development') {
		return 'localhost:1999';
	}

	if (process.env.VERCEL_ENV === 'preview') {
		if (hasPartykitChanges()) {
			return getPartykitHostFromEnv();
		}
		return SHARED_PREVIEW_HOST;
	}

	return getPartykitHostFromEnv();
};

const nextConfig: NextConfig = {
	env: {
		NEXT_PUBLIC_PARTYKIT_HOST: getPartykitHostForBuild(),
	},
	productionBrowserSourceMaps: true,
	typescript: {
		// Warning: This allows production builds to successfully complete even if
		// your project has TypeScript errors.
		ignoreBuildErrors: true,
	},
};

export default nextConfig;
