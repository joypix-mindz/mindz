// eslint-disable-next-line @typescript-eslint/no-var-requires
const chalk = require('chalk');
const printer = {
  debug: msg => {
    const result = chalk.green`debug` + chalk.white('  - ' + msg);
    console.log(result);
    return result;
  },
  info: msg => {
    const result = chalk.rgb(19, 167, 205)`info` + chalk.white('  - ' + msg);
    console.log(result);
    return result;
  },
  warn: msg => {
    const result = chalk.yellow`warn` + chalk.white('  - ' + msg);
    console.log(result);
    return result;
  },
};

module.exports = { printer };
