import type {SearchQuery, SearchResponse} from "../../../shared/types/storage.js";
import type {MessageType} from "../../../shared/types/msg.js";
import type {Channel} from "../../models/chan.js";
import type {Message} from "../../models/msg.js";
import type Network from "../../models/network.js";

export type DeletionRequest = {
	olderThanDays: number;
	messageTypes: MessageType[] | null; // null means no restriction
	limit: number; // -1 means unlimited
};

export interface MessageStorage {
	isEnabled: boolean;

	enable(): Promise<void>;

	close(): Promise<void>;

	index(network: Network, channel: Channel, msg: Message): Promise<void>;

	deleteChannel(network: Network, channel: Channel): Promise<void>;

	getMessages(network: Network, channel: Channel, nextID: () => number): Promise<Message[]>;

	canProvideMessages(): boolean;
}

export type SearchFunction = (query: SearchQuery) => Promise<SearchResponse>;

export interface SearchableMessageStorage extends MessageStorage {
	search: SearchFunction;
}
