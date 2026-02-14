import { objects, predicates } from 'friendly-words';

/**
 * Generates a random room name in the format "predicate-predicate-object".
 * This follows the pattern used by Glitch and provides a friendly, easy-to-read name.
 */
export function generateRoomName(): string {
	const p1 = predicates[Math.floor(Math.random() * predicates.length)];
	const p2 = predicates[Math.floor(Math.random() * predicates.length)];
	const o = objects[Math.floor(Math.random() * objects.length)];

	return `${p1}-${p2}-${o}`;
}
