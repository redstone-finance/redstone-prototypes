const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");
const client = new SSMClient({ region: "eu-west-1" });

async function getSSMParameterValue(parameterName) {
  const command = new GetParameterCommand({
    Name: parameterName,
    WithDecryption: true,
  });
  return (await client.send(command)).Parameter.Value;
}

async function fetchConfig() {
  try {
    const influxDbUrlPromise = getSSMParameterValue("/dev/influxdb/url");
    const influxDbTokenPromise = getSSMParameterValue("/dev/influxdb/token");

    const [influxDbUrl, influxDbToken] = await Promise.all([
      influxDbUrlPromise,
      influxDbTokenPromise,
    ]);

    return {
      influxDbUrl,
      influxDbToken,
    };
  } catch (error) {
    console.error("Error fetching configuration:", error);
    throw error;
  }
}

module.exports = {
  fetchConfig,
};

// TODO: uncomment when on AWS lambda if used there
// const AWS = require("aws-sdk");
// const ssm = new AWS.SSM();

// async function getSSMParameter(parameterName) {
//   const params = {
//     Name: parameterName,
//     WithDecryption: true,
//   };

//   try {
//     const response = await ssm.getParameter(params).promise();
//     return response.Parameter.Value;
//   } catch (error) {
//     console.error(`Error getting ${parameterName} from SSM:`, error);
//     throw error;
//   }
// }

// async function fetchConfig() {
//   const influxDbUrlPromise = getSSMParameter("/dev/influxdb/url");
//   const influxDbTokenPromise = getSSMParameter("/dev/influxdb/token");

//   const [influxDbUrl, influxDbToken] = await Promise.all([
//     influxDbUrlPromise,
//     influxDbTokenPromise,
//   ]);

//   const influx = new InfluxDB({
//     url: influxDbUrl,
//     token: influxDbToken,
//     org: "redstone",
//     timeout: 1 * 60 * 1000, // 1 minute
//   });

//   return influx;
// }
