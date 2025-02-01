import storage from "./localStorage.js";
import location from "./location.js";

export default class Auth {
	static signout() {
		storage.clear();
		location.reload();
	}
}
