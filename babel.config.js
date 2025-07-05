// Use require for compatibility, as babel.config.js is often treated as CommonJS
const fbtCommon = require('./common_strings.json');

const config = {
	plugins: [],
	presets: [['@nkzw/babel-preset-fbtee', { fbtCommon }], 'next/babel'],
};

module.exports = config; // Use module.exports for CommonJS
