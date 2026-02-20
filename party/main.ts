import type { Server, Worker } from 'partykit/server';

export default class MainPartyServer implements Server {}

MainPartyServer satisfies Worker;
