import { NextConfig } from 'next';
import fbtCommon from './common_strings.json' with { type: 'json' };
import { getPartykitHostFromEnv } from './src/lib/partykit-host';

const SHARED_PREVIEW_HOST = 'preview.adameter-party.clentfort.partykit.dev';

const getPartykitHostForBuild = () => {
	const explicitHost = process.env.NEXT_PUBLIC_PARTYKIT_HOST;
	if (explicitHost) {
		return explicitHost.replace(/^https?:\/\//, '').replace(/\/$/, '');
	}

	if (process.env.NODE_ENV === 'development') {
		return 'localhost:1999';
	}

	if (process.env.VERCEL_ENV === 'preview') {
		return SHARED_PREVIEW_HOST;
	}

	return getPartykitHostFromEnv();
};

const nextConfig: NextConfig = {
	env: {
		NEXT_PUBLIC_PARTYKIT_HOST: getPartykitHostForBuild(),
	},
	experimental: {
		swcPlugins: [['@nkzw/swc-plugin-fbtee', { fbtCommon }]],
	},
	productionBrowserSourceMaps: true,
	typescript: {
		// Warning: This allows production builds to successfully complete even if
		// your project has TypeScript errors.
		ignoreBuildErrors: true,
	},
};

export default nextConfig;
