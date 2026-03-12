import { NextConfig } from 'next';
import { getPartykitHostFromEnv } from './src/lib/partykit-host';

const getPartykitHostForBuild = () => {
	// In development, use the local PartyKit dev server.
	if (process.env.NODE_ENV === 'development') {
		return 'localhost:1999';
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
