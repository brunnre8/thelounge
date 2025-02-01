import socket from "../socket.js";
import {store} from "../store.js";

socket.on("topic", function (data) {
	const channel = store.getters.findChannel(data.chan);

	if (channel) {
		channel.channel.topic = data.topic;
	}
});
