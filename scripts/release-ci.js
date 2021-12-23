const shell = require("shelljs");
const { readJsonSync } = require("fs-extra");
const { join } = require("path");
const { argv } = require("yargs");
const simpleGit = require("simple-git");

const pkgDirMap = require("./pkgname");
const { log, warn, error } = require("../scripts/log");
const toUpload = require("./wechat_ci");

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
const lernaChanged = shell.exec("npx lerna changed").stdout;
console.log("lernaChanged:", lernaChanged);
// 包名
const changedRepos = lernaChanged
  .split("\n")
  .map((line) => line.replace("- ", ""))
  .filter((line) => line !== "");

if (changedRepos.length === 0) {
  log("没有需要更新的包");
  shell.exit(0);
}

_commit(changedRepos);

async function _commit(changedRepos) {
  console.log("changedRepos:", changedRepos);

  // 是否全部更新
  const isAllUpload = pkgDirMap.common.some(
    (commonPkg) => changedRepos.indexOf(commonPkg.packageName) > -1
  );

  const git = simpleGit();
  const listLogSummary = await git.log({ n: 1 });

  let commitMsg = `"${listLogSummary.latest.message} -${CI_JOB_ID}-${CI_COMMIT_SHA}-"`;

  const { version } = readJsonSync(join(cwd, "lerna.json"));
  commitMsg = commitMsg.replace('-"', ` -${version} [skip ci]"`);
  // console.log("process.env:", process.env);
  shell.exec(`git tag -a ${version} -m "${CI_JOB_ID}-${CI_COMMIT_SHA}"`);
  shell.exec("git add .");
  shell.exec(`git commit --no-verify -m ${commitMsg}`);
  // console.log(
  //   ` git push --follow-tags https://${GL_USER_NAME}:${GL_TOKEN}@${REPO_URL}.git HEAD:$REF`
  // );
  // shell.exec(
  //   ` git push --follow-tags https://${GL_USER_NAME}:${GL_TOKEN}@${REPO_URL}.git HEAD:$REF`
  // );
  isAllUpload ? log("all") : log("independent");
  let needUpdatePkg = isAllUpload
    ? pkgDirMap.independent
    : pkgDirMap.independent.filter(
        (independentPkg) =>
          changedRepos.indexOf(independentPkg.packageName) > -1
      );
  console.log(needUpdatePkg);
  for (let i = 0; i < needUpdatePkg.length; i++) {
    console.log(needUpdatePkg[i][`${tag}_command`]);
    await new Promise((res) => {
      shell.exec(needUpdatePkg[i][`${tag}_command`], async () => {
        res(toUpload(needUpdatePkg[i]));
      });
    });
  }

  // if (isAllUpload) {
  //   log("yes");
  //   for (let i = 0; i < pkgDirMap.independent.length; i++) {
  //     console.log(pkgDirMap.independent[i][`${tag}_command`]);
  //     await new Promise((res) => {
  //       shell.exec(pkgDirMap.independent[i][`${tag}_command`], async () => {
  //         res(toUpload(pkgDirMap.independent[i]));
  //       });
  //     });
  //   }
  // } else {
  //   log("no");
  //   let tempArr = pkgDirMap.independent.filter(
  //     (independentPkg) => changedRepos.indexOf(independentPkg.packageName) > -1
  //   );
  //   console.log("tempArr:", tempArr);
  //   for (let i = 0; i < tempArr.independent.length; i++) {
  //     console.log(tempArr.independent[i][`${tag}_command`]);
  //     await new Promise((res) => {
  //       shell.exec(tempArr.independent[i][`${tag}_command`], async () => {
  //         console.log(tempArr.independent[i], 22);
  //         res(toUpload(tempArr.independent[i]));
  //       });
  //     });
  //   }
  // }
}
