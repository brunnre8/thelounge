import colors from "chalk";
import {Command} from "commander";
import fs from "fs";
import log from "../../log.js";
import Config from "../../config.js";
import Utils from "../utils.js";
import ClientManager from "../../clientManager.js";

const program = new Command("remove");
program
	.description("Remove an existing user")
	.on("--help", Utils.extraHelp)
	.argument("<name>", "name of the user")
	.action(function (name) {
		if (!fs.existsSync(Config.getUsersPath())) {
			log.error(`${Config.getUsersPath()} does not exist.`);
			return;
		}

		const manager = new ClientManager();

		try {
			if (manager.removeUser(name)) {
				log.info(`User ${colors.bold(name)} removed.`);
			} else {
				log.error(`User ${colors.bold(name)} does not exist.`);
			}
		} catch (e: any) {
			// There was an error, already logged
		}
	});

export default program;
