const fs = require("fs");
const path = require("path");

function runScripts(dir, scriptsToRun) {
  scriptsToRun.forEach((jsFile) => {
    const filePath = path.join(dir, `${jsFile}.js`);

    if (fs.existsSync(filePath)) {
      try {
        console.log(`Running ${jsFile}.js...`);
        require(filePath);
        console.log(`${jsFile}.js finished successfully.`);
      } catch (error) {
        console.error(`Error occurred while running ${jsFile}.js:`, error);
      }
    } else {
      console.error(`${jsFile}.js does not exist.`);
    }
  });
}

const fetchersDir = path.join(__dirname, "fetchers");
const fetchersToRun = [
  "balancerV2",
  "curve",
  "maverick",
  "uniV2-like",
  "uniV3-like",
];

runScripts(fetchersDir, fetchersToRun);

const resultsAggregatorsDir = path.join(__dirname, "results-aggregators");
const resultsAggregatorsToRun = ["generateProdResults", "weightStrategy"];

runScripts(resultsAggregatorsDir, resultsAggregatorsToRun);
