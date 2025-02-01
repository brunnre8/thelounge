import socket from "../socket.js";
import Auth from "../auth.js";

socket.on("sign-out", function () {
	Auth.signout();
});
