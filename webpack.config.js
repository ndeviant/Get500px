const webpack = require("webpack");
const path = require("path");
const fileSystem = require("fs");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const WriteFilePlugin = require("write-file-webpack-plugin");
const env = require("./utils/env");

// load the secrets
const alias = {};

const secretsPath = path.join(__dirname, `secrets.${env.NODE_ENV}.js`);

const fileExtensions = [
	"jpg",
	"jpeg",
	"png",
	"gif",
	"eot",
	"otf",
	"svg",
	"ttf",
	"woff",
	"woff2",
];

if (fileSystem.existsSync(secretsPath)) {
	alias.secrets = secretsPath;
}

const options = {
	mode: env.NODE_ENV || "development",
	entry: {
		options: path.join(__dirname, "src", "js", "options.js"),
		background: path.join(__dirname, "src", "js", "background.js"),
		contentScript: path.join(__dirname, "src", "js", "contentScript.js"),
	},
	output: {
		path: path.join(__dirname, "build"),
		filename: "[name].bundle.js",
	},
	chromeExtensionBoilerplate: {
		notHotReload: ["contentScript"],
	},
	module: {
		rules: [
			{
				test: /\.css$/,
				loader: "style-loader!css-loader",
				exclude: /node_modules/,
			},
			{
				test: new RegExp(`.(${fileExtensions.join("|")})$`),
				loader: "file-loader?name=[name].[ext]",
				exclude: /node_modules/,
			},
			{
				test: /\.html$/,
				loader: "html-loader",
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		alias,
	},
	plugins: [
		// clean the build folder
		new CleanWebpackPlugin(),
		// expose and write the allowed env vars on the compiled bundle
		new webpack.EnvironmentPlugin(["NODE_ENV"]),
		new CopyWebpackPlugin({
			patterns: [
				{
					from: "src/manifest.json",
					transform(content, path) {
						// generates the manifest file using the package.json informations
						return Buffer.from(
							JSON.stringify({
								description: process.env.npm_package_description,
								version: process.env.npm_package_version,
								...JSON.parse(content.toString()),
							}),
						);
					},
				},
			],
		}),
		new HtmlWebpackPlugin({
			template: path.join(__dirname, "src", "options.html"),
			filename: "options.html",
			chunks: ["options"],
		}),
		new HtmlWebpackPlugin({
			template: path.join(__dirname, "src", "background.html"),
			filename: "background.html",
			chunks: ["background"],
		}),
		new WriteFilePlugin(),
	],
};

if (env.NODE_ENV === "development") {
	options.devtool = "cheap-module-eval-source-map";
}

module.exports = options;
