import fbtCommon from './common_strings.json' with { type: 'json' };

module.exports = (api) => {
  // `api.env()` is 'test' when running Vitest if you set NODE_ENV=test (which Vitest usually does)
  // or if you configure a custom Babel env in your Vite config.
  const isTest = api.env('test'); // Check if the environment is 'test'

  const presets = [
    ['@nkzw/babel-preset-fbtee', { fbtCommon }],
    // Conditionally configure next/babel or another preset
    // to output ESM for tests
    [
      'next/babel',
      {
        // This is the key: Configure 'next/babel' to output ESM for tests
        // Next.js uses different modules based on target/env.
        // We want to force ESM for the test build.
        // This might be tricky as 'next/babel' is opaque.
        // A more reliable approach is to override module output if needed.
        'preset-env': {
          modules: isTest ? false : 'auto', // `false` keeps ESM imports/exports
          // Other preset-env options you might need
        },
      },
    ],
  ];

  const plugins = []; // Your existing plugins

  return {
    plugins,
    presets,
  };
};
