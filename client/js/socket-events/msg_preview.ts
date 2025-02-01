import socket from "../socket.js";
import {store} from "../store.js";

socket.on("msg:preview", function (data) {
	const netChan = store.getters.findChannel(data.chan);
	const message = netChan?.channel.messages.find((m) => m.id === data.id);

	if (!message || !message.previews) {
		return;
	}

	const previewIndex = message.previews.findIndex((m) => m.link === data.preview.link);

	if (previewIndex > -1) {
		message.previews[previewIndex] = data.preview;
	}
});
