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

const nextConfig: NextConfig = {
	env: {
		NEXT_PUBLIC_PARTYKIT_HOST: partykitHost,
	},
	productionBrowserSourceMaps: true,
	typescript: {
		// Warning: This allows production builds to successfully complete even if
		// your project has TypeScript errors.
		ignoreBuildErrors: true,
	},
};

export default withFbtee({ fbtCommon })(nextConfig);
