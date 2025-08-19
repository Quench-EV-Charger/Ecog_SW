const readline = require("readline");
const fs = require("fs");

const helpers = require("../helpers");

module.exports.insert = async () => {
  const version = await helpers.execPromise("git describe --always");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  fs.writeFileSync("./build/version", version, (err) => {
    if (err) throw err;
  });
  rl.close();
};
