const adjectives = [
	'happy',
	'sunny',
	'playful',
	'clever',
	'gentle',
	'bright',
	'jolly',
	'brave',
	'calm',
	'kind',
	'silly',
	'sweet',
	'tiny',
	'lively',
	'merry',
];

const colors = [
	'red',
	'blue',
	'green',
	'yellow',
	'purple',
	'orange',
	'pink',
	'teal',
	'gold',
	'silver',
];

const animals = [
	'panda',
	'koala',
	'rabbit',
	'otter',
	'penguin',
	'fox',
	'deer',
	'whale',
	'dolphin',
	'tiger',
	'lion',
	'bear',
	'elephant',
	'giraffe',
	'monkey',
];

/**
 * Generates a human-readable room name.
 */
export function generateRoomName(): string {
	const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
	const color = colors[Math.floor(Math.random() * colors.length)];
	const animal = animals[Math.floor(Math.random() * animals.length)];
	return `${adj}-${color}-${animal}`;
}
