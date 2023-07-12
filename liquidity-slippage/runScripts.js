const glob = require("glob");
const { execSync } = require("child_process");

glob("*.js", {}, (err, files) => {
  if (err) {
    console.error("Error occurred while searching for JS files:", err);
    return;
  }

  files.forEach((file) => {
    if (
      file !== "runScripts.js" &&
      file !== "constants.js" &&
      file !== "common.js"
    ) {
      console.log(`Running script: ${file}`);
      try {
        execSync(`node ${file}`, { stdio: "inherit" });
      } catch (err) {
        console.error(`Error occurred while running script: ${file}`, err);
      }
      console.log(`Script completed: ${file}`);
    }
  });
});
