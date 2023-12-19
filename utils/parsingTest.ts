function parseInfluxUrl(influxUrl: string): [string, string, string] {
  const parsedUrl = new URL(influxUrl);
  const apiUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
  const org = parsedUrl.searchParams.get("org") || "";
  const bucket = parsedUrl.searchParams.get("bucket") || "";

  return [apiUrl, org, bucket];
}

const influxUrl =
  "http://24.120.191.18:2186/api/v2/write?org=SomeOrg&bucket=some-bucket&precision=ms";
const [url, org, bucket] = parseInfluxUrl(influxUrl);

console.log("URL:", url);
console.log("Org:", org);
console.log("Bucket:", bucket);
