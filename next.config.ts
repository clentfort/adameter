import { NextConfig } from 'next';

const nextConfig: NextConfig = {
	productionBrowserSourceMaps: true,
	serverExternalPackages: ['yjs'],
	typescript: {
		// Warning: This allows production builds to successfully complete even if
		// your project has TypeScript errors.
		ignoreBuildErrors: true,
	},
};

export default nextConfig;
