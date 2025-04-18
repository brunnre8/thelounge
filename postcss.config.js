import pcImport from "postcss-import";
import presetEnv from "postcss-preset-env";
import cssnano from "cssnano";

module.exports = {
	plugins: [
		pcImport(),
		presetEnv(),
		cssnano({
			preset: [
				"default",
				{
					mergeRules: false,
					discardComments: {
						removeAll: true,
					},
				},
			],
		}),
	],
};
