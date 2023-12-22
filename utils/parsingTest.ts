interface InfluxConnectionInfo {
  url: string;
  org: string;
  bucket: string;
  precision: string;
}

function parseInfluxUrl(influxUrl: string): InfluxConnectionInfo {
  const parsedUrl = new URL(influxUrl);
  return {
    url: `${parsedUrl.protocol}//${parsedUrl.host}`,
    org: parsedUrl.searchParams.get("org") || "",
    bucket: parsedUrl.searchParams.get("bucket") || "",
    precision: parsedUrl.searchParams.get("precision") || "ms",
  };
}

function testParseInfluxUrl() {
  const influxUrl =
    "http://24.120.191.18:2186/api/v2/write?org=SomeOrg&bucket=some-bucket&precision=ms";
  const influxConnectionInfo = parseInfluxUrl(influxUrl);

  console.log("Parsed InfluxDB Connection Info:");
  console.log("URL:", influxConnectionInfo.url);
  console.log("Org:", influxConnectionInfo.org);
  console.log("Bucket:", influxConnectionInfo.bucket);
  console.log("Precision:", influxConnectionInfo.precision);
}

testParseInfluxUrl();
