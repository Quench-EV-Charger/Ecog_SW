const version = require("./version");

const main = async () => {
  await version.insert();
};

main();
