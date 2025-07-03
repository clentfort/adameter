import {
	decrypt as unboundDecrypt,
	encrypt as unboundEncrypt,
} from 'crypto-js/aes';
import encoding from 'crypto-js/enc-utf8';

type Encrypteable =
	| unknown[]
	| string
	| number
	| boolean
	| null
	| undefined
	| object;

type TypeName<T extends Encrypteable> = T extends unknown[]
	? 'array'
	: T extends string
		? 'string'
		: T extends number
			? 'number'
			: T extends boolean
				? 'boolean'
				: T extends null
					? 'null'
					: T extends undefined
						? 'undefined'
						: T extends object
							? 'object'
							: never;

export type Encrypted<T extends Encrypteable> = {
	__type: TypeName<T>;
} & (T extends Array<infer U>
	? U extends Encrypteable
		? Array<Encrypted<U>>
		: never
	: T extends null
		? null
		: T extends object
			? { [k in keyof T]: T[k] extends Encrypteable ? Encrypted<T[k]> : never }
			: T extends undefined
				? undefined
				: string);

export function encrypt<T extends Encrypteable>(
	value: T,
	secret: string,
): Encrypted<T> {
	if (value === undefined) {
		return undefined as unknown as Encrypted<T>;
	}
	if (Array.isArray(value)) {
		return value.map((v) => encrypt(v, secret)) as unknown as Encrypted<T>;
	}
	if (typeof value === 'object' && value !== null) {
		return Object.fromEntries(
			Object.entries(value).map(([key, value]) => [
				key,
				encrypt(value, secret),
			]),
		) as unknown as Encrypted<T>;
	}

	if (
		typeof value === 'string' ||
		typeof value === 'number' ||
		typeof value === 'boolean' ||
		value === null
	) {
		return encryptPrimitive(value, secret) as unknown as Encrypted<T>;
	}

	throw new Error();
}

function encryptPrimitive(
	primitive: string | number | boolean | null,
	secret: string,
) {
	return unboundEncrypt(JSON.stringify(primitive), secret).toString();
}

export type Decrypted<T extends Encrypted<Encrypteable>> = T extends {
	__type: 'array';
} & Array<infer U>
	? U extends Encrypted<Encrypteable>
		? Array<Decrypted<U>>
		: never
	: T extends { __type: 'object' } & object
		? {
				[k in keyof Omit<T, '__type'>]: T[k] extends Encrypted<Encrypteable>
					? Decrypted<T[k]>
					: never;
			}
		: T extends string
			? T extends { __type: 'string' }
				? string
				: T extends { __type: 'number' }
					? number
					: T extends { __type: 'boolean' }
						? boolean
						: T extends { __type: 'null' }
							? null
							: T extends { __type: 'undefined' }
								? undefined
								: unknown
			: never;

export function decrypt<T extends Encrypted<Encrypteable>>(
	value: T,
	secret: string,
): Decrypted<T> {
	if (value === undefined) {
		return undefined as unknown as Decrypted<T>;
	}

	if (Array.isArray(value)) {
		return value.map((v) => decrypt(v, secret)) as unknown as Decrypted<T>;
	}

	if (typeof value === 'object' && value !== null) {
		return Object.fromEntries(
			Object.entries(value).map(([key, value]) => [
				key,
				decrypt(value as Encrypted<Encrypteable>, secret),
			]),
		) as unknown as Decrypted<T>;
	}

	try {
		return decryptPrimitive(value, secret) as unknown as Decrypted<T>;
	} catch (error) {
		throw new Error('Could not decrypt primitive', { cause: error });
	}
}

function decryptPrimitive(
	primitive: string,
	secret: string,
): string | null | number | boolean {
	return JSON.parse(unboundDecrypt(primitive, secret).toString(encoding));
}
