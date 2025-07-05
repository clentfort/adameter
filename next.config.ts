import { NextConfig } from 'next';

const nextConfig: NextConfig = {
	eslint: {
		// Warning: This allows production builds to successfully complete even if
		// your project has ESLint errors.
		ignoreDuringBuilds: true,
	},
	productionBrowserSourceMaps: true, // Can be useful, keep for now
	typescript: {
		// Warning: This allows production builds to successfully complete even if
		// your project has TypeScript errors.
		ignoreBuildErrors: true,
	},
	// Ensure Webpack can handle fbt/fbtee if not automatically handled by Next.js 15+
	// For fbtee, direct Webpack configuration is usually not needed if using the Babel preset.
	// If issues arise with fbt/fbtee, this might be a place to add specific webpack config.
};

export default nextConfig;
