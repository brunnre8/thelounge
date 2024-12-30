import colors from "chalk";
import {Command} from "commander";
import log from "../../log.js";
import Utils from "../utils.js";
import ClientManager from "../../clientManager.js";

export default new Command("list")
	.description("List all users")
	.on("--help", Utils.extraHelp)
	.action(function () {
		const users = new ClientManager().getUsers();

		if (users === undefined) {
			// There was an error, already logged
			return;
		}

		if (users.length === 0) {
			log.info(
				`There are currently no users. Create one with ${colors.bold(
					"thelounge add <name>"
				)}.`
			);
			return;
		}

		log.info("Users:");
		users.forEach((user, i) => {
			log.info(`${i + 1}. ${colors.bold(user)}`);
		});
	});
