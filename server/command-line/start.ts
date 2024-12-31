import colors from "chalk";
import fs from "fs";
import path from "path";
import log from "../log.js";
import {Command} from "commander";
import Config from "../config.js";
import Utils from "./utils.js";
import server from "../server.js";

export default new Command("start")
	.description("Start the server")
	.option("--dev", "Development mode with hot module reloading")
	.on("--help", Utils.extraHelp)
	.action(async function (options) {
		initalizeConfig();
		await server(options);
	});

function initalizeConfig() {
	if (!fs.existsSync(Config.getConfigPath())) {
		fs.mkdirSync(Config.getHomePath(), {recursive: true});
		fs.chmodSync(Config.getHomePath(), "0700");
		fs.copyFileSync(
			// TODO: fix the import meta dirname
			path.resolve(
				path.join((import.meta as any).dirname, "..", "..", "defaults", "config.js")
			),
			Config.getConfigPath()
		);
		log.info(`Configuration file created at ${colors.green(Config.getConfigPath())}.`);
	}

	fs.mkdirSync(Config.getUsersPath(), {recursive: true, mode: 0o700});
}
