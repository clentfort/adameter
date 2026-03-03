# tinybase-persister-partykit-client-encrypted

`tinybase-persister-partykit-client-encrypted` is a TinyBase custom persister
for PartyKit that encrypts synchronized values in the browser with AES-GCM.

It keeps TinyBase's cell-level sync behavior while ensuring PartyKit only
receives encrypted values.

## Install

```bash
pnpm add tinybase-persister-partykit-client-encrypted
```

## Usage

```ts
import PartySocket from 'partysocket';
import { createStore } from 'tinybase';
import {
	createSecurePartyKitPersister,
	getEncryptionKey,
	hashRoomId,
} from 'tinybase-persister-partykit-client-encrypted';

const store = createStore();
const roomName = 'my-room';

const [hashedRoomId, encryptionKey] = await Promise.all([
	hashRoomId(roomName),
	getEncryptionKey(roomName),
]);

const socket = new PartySocket({
	host: 'your.partykit.host',
	party: 'tinybase',
	room: hashedRoomId,
});
socket.name = 'tinybase';

const persister = createSecurePartyKitPersister(store, socket, encryptionKey);
await persister.startAutoLoad();
await persister.startAutoSave();
```

## Release model

- GitHub Actions runs `semantic-release` on `main`
- npm publish uses trusted publishing with provenance
- versioning follows Conventional Commits

## Security note

Deriving keys from room names alone is convenient, but weak if room names are
easy to guess. For stronger security, derive or provide keys from high-entropy
secrets.
