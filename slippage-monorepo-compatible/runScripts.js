const fs = require("fs").promises;
const path = require("path");

async function runScript(filePath) {
  try {
    console.log(`Running ${filePath}...`);
    const scriptRunFunction = require(filePath);
    if (typeof scriptRunFunction === "function") {
      console.log(`Running ${filePath}...`);
      await scriptRunFunction();
      console.log(`${filePath} finished successfully.`);
    } else {
      console.log(`${filePath} does not export a function.`);
    }
  } catch (error) {
    console.error(`Error occurred while running ${filePath}:`, error);
  }
}

async function runScripts(dir, scriptsToRun) {
  for (const jsFile of scriptsToRun) {
    const filePath = path.join(dir, `${jsFile}.js`);
    try {
      await fs.access(filePath);
      await runScript(filePath);
    } catch (error) {
      if (error.code === "ENOENT") {
        console.error(`${jsFile}.js does not exist.`);
      } else {
        console.error(`Error checking file ${jsFile}.js:`, error);
      }
    }
  }
}

const fetchersDir = path.join(__dirname, "fetchers");
const fetchersToRun = [
  "balancerV2",
  "curve",
  "maverick",
  "uniV2-like",
  "uniV3-like",
];

const resultsAggregatorsDir = path.join(__dirname, "results-aggregators");
const resultsAggregatorsToRun = ["generateProdResults", "weightStrategy"];

async function main() {
  await runScripts(fetchersDir, fetchersToRun);
  await runScripts(resultsAggregatorsDir, resultsAggregatorsToRun);
}

main();
