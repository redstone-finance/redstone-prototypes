const axios = require("axios");
const fs = require("fs");

async function updateLimits(service) {
  const configUrl = `https://raw.githubusercontent.com/your-remote-config-repo/circuit-breaker-${service}-xasdqwr.json`;
  try {
    const response = await axios.get(configUrl);
    const config = response.data;

    // Update hard limits based on the service type (normal/stablecoin)
    const percentageChange = service === "primary-prod" ? 0.5 : 0.02;
    for (const token in config) {
      const { lower, upper } = config[token];
      const latestValue = fetchLatestValueForToken(token); // Implement this function to fetch the latest value for each token.
      const newLower = latestValue * (1 - percentageChange);
      const newUpper = latestValue * (1 + percentageChange);
      config[token] = { lower: newLower, upper: newUpper };
    }

    // Save the updated limits back to the file
    fs.writeFileSync(
      `circuit-breaker-${service}-xasdqwr.json`,
      JSON.stringify(config, null, 2)
    );
  } catch (error) {
    // Send an alert to a configurable uptime-kuma URL in case of any issues during the update
    const alertUrl = "https://your-uptime-kuma-url/alert";
    axios.post(alertUrl, {
      message: `Error updating limits for ${service}: ${error.message}`,
    });
  }
}

function fetchLatestValueForToken(token) {
  // Implement the logic to fetch the latest value for the given token.
  // You may use an API or any other data source to get this value.
  // For this example, let's assume a dummy value.
  return 1000;
}

const service = process.argv[2];
if (service) {
  updateLimits(service);
} else {
  console.error(
    "Please provide the service name (e.g., primary-prod or avalanche-prod)."
  );
}
