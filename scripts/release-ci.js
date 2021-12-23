const shell = require("shelljs");
const { readJsonSync } = require("fs-extra");
const { join } = require("path");
const { argv } = require("yargs");
const simpleGit = require("simple-git");

// const pkgDirMap = require("./pkgname");
const { log, warn, error } = require("../scripts/log");

const { tag } = argv;

warn(`publish argv: ${tag}`);

if (!tag) {
  error.log(`请检查参数 tag:${tag}`);
  shell.exit(1);
}

warn("请确保 changelog-ci.js 运行完毕");

const cwd = process.cwd();

const { CI_JOB_ID, CI_COMMIT_SHA, GL_USER_NAME, GL_TOKEN, REPO_URL } =
  process.env;

// 变动包
// const lernaChanged = shell.exec("npx lerna changed").stdout;
// console.log("lernaChanged:", lernaChanged);
// 包名
// const changedRepos = lernaChanged
//   .split("\n")
//   .map((line) => line.replace("- ", ""))
//   .filter((line) => line !== "");

// if (changedRepos.length === 0) {
//   log("没有需要更新的包");
//   shell.exit(0);
// }

_commit();

async function _commit() {
//   console.log("changedRepos:", changedRepos);
  const git = simpleGit();
  const listLogSummary = await git.log({ n: 1 });

  let commitMsg = `"${listLogSummary.latest.message} -${CI_JOB_ID}-${CI_COMMIT_SHA}-"`;

  const { version } = readJsonSync(join(cwd, "package.json"));
  commitMsg = commitMsg.replace('-"', ` -${version} [skip ci]"`);
  // console.log("process.env:", process.env);
  shell.exec(`git tag -a ${version} -m "${CI_JOB_ID}-${CI_COMMIT_SHA}"`);
  shell.exec("git add .");
  shell.exec(`git commit --no-verify -m ${commitMsg}`);
}
