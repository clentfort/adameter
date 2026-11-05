import withFbtee from '@nkzw/next-plugin-fbtee';
import { NextConfig } from 'next';
import fbtCommon from './common_strings.json' with { type: 'json' };
import { getPartykitHostFromEnv } from './src/lib/partykit-host';

const getPartykitHostForBuild = () => {
	const explicitHost = process.env.NEXT_PUBLIC_PARTYKIT_HOST;
	if (explicitHost) {
		return explicitHost.replace(/^https?:\/\//, '').replace(/\/$/, '');
	}

	if (process.env.NODE_ENV === 'development') {
		return 'localhost:1999';
	}

	return getPartykitHostFromEnv();
};

const partykitHost = getPartykitHostForBuild();

// Versions the service worker, so every deploy precaches its own pages.
const buildId =
	process.env.VERCEL_DEPLOYMENT_ID ??
	process.env.VERCEL_GIT_COMMIT_SHA ??
	'local';

const nextConfig: NextConfig = {
	// The e2e suite builds into its own directory next to `next dev`.
	distDir: process.env.NEXT_DIST_DIR ?? '.next',
	env: {
		NEXT_PUBLIC_BUILD_ID: buildId,
		NEXT_PUBLIC_PARTYKIT_HOST: partykitHost,
	},
	async headers() {
		return [
			{
				headers: [
					{
						key: 'Cache-Control',
						value: 'no-cache, no-store, must-revalidate',
					},
				],
				source: '/sw.js',
			},
		];
	},
	productionBrowserSourceMaps: true,
	typescript: {
		// Warning: This allows production builds to successfully complete even if
		// your project has TypeScript errors.
		ignoreBuildErrors: true,
	},
};

export default withFbtee({ fbtCommon })(nextConfig);
