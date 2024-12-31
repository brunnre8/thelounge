/** @type {import('@volar-plugins/prettier')} */
import {volarPrettierPlugin} from "@volar-plugins/prettier";

module.exports = {
	plugins: [
		volarPrettierPlugin({
			languages: ["html", "css", "scss", "typescript", "javascript"],
			html: {
				breakContentsFromTags: true,
			},
			useVscodeIndentation: true,
		}),
	],
};
