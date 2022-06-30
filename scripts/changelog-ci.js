const shell = require("shelljs");
const { argv } = require("yargs");
const { log, error } = require("./log");
const tags = require("./tags");

const { tag } = argv;
console.log('argv', argv);
if (!tag) {
  error(`请检查参数 tag:${tag}`);
  shell.exit(1);
}

// lerna updated 判断某个package自上一次发布（last tag）以来，是否有更新
const lernaUpdated = shell.exec("npx lerna changed").stdout;
console.log("lernaUpdated", lernaUpdated);

// shell.exit(0);
const updatedRepos = lernaUpdated
  .split("\n")
  .map((line) => line.replace("- ", ""))
  .filter((line) => line !== "");

if (updatedRepos.length === 0) {
  log("没有需要更新的包");
  shell.exit(0);
} else {
  updateChangelog(tag);
}
updateChangelog(tag);

function updateChangelog(_tag) {
  let cmd = ["npx lerna version"];
  let _args = [
    "--yes",
    "--conventional-commits",
    "--no-git-tag-version",
    "--no-push",
  ];
  let args;

  if (tags.unstable.indexOf(_tag) > -1) {
    args = cmd
      .concat("prerelease")
      .concat(_args)
      .concat("--no-changelog")
      .concat("--conventional-prerelease", `--preid=${_tag}`);
  } else {
    // stable
    args = cmd.concat(_args).concat("--conventional-graduate");
  }

  const command = args.join(" ");
  log(`exec: ${command}`);
  shell.exec(command, function (code, stdout, stderr) {
    log("command exit code:", code);
    log("command stdout:", stdout);
    log("command stderr:", stderr);
    shell.exit(code);
  });
}
