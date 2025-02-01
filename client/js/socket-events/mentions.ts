import socket from "../socket.js";
import {store} from "../store.js";
import type {ClientMention} from "../types.js";
import type {SharedMention} from "../../../shared/types/mention.js";

socket.on("mentions:list", function (data) {
	store.commit("mentions", data.map(sharedToClientMention));
});

function sharedToClientMention(shared: SharedMention): ClientMention {
	const mention: ClientMention = {
		...shared,
		localetime: "", // TODO: can't be right
		channel: null,
	};
	return mention;
}
