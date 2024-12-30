import {defaults} from "lodash-es";
import Prefix from "./prefix.js";

class User {
	modes!: string[];
	// Users in the channel have only one mode assigned
	mode!: string;
	away!: string;
	nick!: string;
	lastMessage!: number;

	constructor(attr: Partial<User>, prefix?: Prefix) {
		defaults(this, attr, {
			modes: [],
			away: "",
			nick: "",
			lastMessage: 0,
		});

		Object.defineProperty(this, "mode", {
			get() {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return this.modes[0] || "";
			},
		});

		this.setModes(this.modes, prefix || new Prefix([]));
	}

	setModes(modes: string[], prefix: Prefix) {
		// irc-framework sets character mode, but The Lounge works with symbols
		this.modes = modes.map((mode) => prefix.modeToSymbol[mode]);
	}

	toJSON() {
		return {
			nick: this.nick,
			modes: this.modes,
			lastMessage: this.lastMessage,
		};
	}
}

export default User;
