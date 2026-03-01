const config = {
	'*.{cjs,js,mjs,jsx,ts,tsx}': [
		'pnpm exec eslint --no-warn-ignored --fix --max-warnings=0',
		'pnpm exec prettier --write',
	],
	'*.{css,json,md,yaml,yml}': 'pnpm exec prettier --write',
	'*.{ts,tsx}': () => 'pnpm run typecheck',
};

export default config;
