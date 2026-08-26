// eslint-disable-next-line @typescript-eslint/no-require-imports
const Module = require('node:module');

// TypeScript 7 has no compiler API yet; typescript-eslint needs TypeScript 6.
const resolveFilename = Module._resolveFilename;
const typescript6 = require.resolve('@typescript/typescript6');

Module._resolveFilename = function (request, parent, ...args) {
	if (
		request === 'typescript' &&
		parent?.filename &&
		/(?:^|[/\\])node_modules[/\\](?:@?typescript-eslint|ts-api-utils)[/\\]/.test(
			parent.filename,
		)
	) {
		return typescript6;
	}

	return resolveFilename.call(this, request, parent, ...args);
};
