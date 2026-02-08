import type { Connection, Room, Server, Worker } from 'partykit/server';
import { onConnect } from 'y-partykit';

export default class MainPartyServer implements Server {
	constructor(readonly room: Room) {}

	onConnect(connection: Connection) {
		return onConnect(connection, this.room, {
			persist: { mode: 'snapshot' },
		});
	}
}

MainPartyServer satisfies Worker;
