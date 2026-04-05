export default {
  branches: ["main"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/git",
  ],
  preset: "angular",
  releaseRules: [
    { type: "feat", release: "minor" },
    { type: "fix", release: "patch" },
    { type: "docs", release: "patch" },
    { type: "style", release: "patch" },
    { type: "refactor", release: "patch" },
    { type: "perf", release: "patch" },
    { type: "test", release: "patch" },
    { breaking: true, release: "major" },
  ],
  parserOpts: {
    noteKeywords: ["BREAKING CHANGE", "BREAKING CHANGES", "BREAKING"],
  },
};
