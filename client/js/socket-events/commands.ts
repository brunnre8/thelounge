import constants from "../constants.js";
import socket from "../socket.js";

socket.on("commands", function (commands) {
	if (commands) {
		constants.commands = commands;
	}
});
