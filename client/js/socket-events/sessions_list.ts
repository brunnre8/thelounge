import socket from "../socket.js";
import {store} from "../store.js";

socket.on("sessions:list", function (data) {
	data.sort((a, b) => b.lastUse - a.lastUse);
	store.commit("sessions", data);
});
