#!/usr/bin/env node
const chalk = require('chalk');
const pino = require('pino');
const logger = pino({
  prettyPrint: {
    colorize: chalk.supportsColor,
    translateTime: 'SYS:standard',
    ignore: 'hostname',
  },
});

const log = message => {
  console.log(chalk.blue(message));
};
const warn = message => {
  console.warn(chalk.yellow(message));
};
const error = message => {
  console.error(chalk.red(message));
};

module.exports = {
  log,
  warn,
  error,
  logger,
};
