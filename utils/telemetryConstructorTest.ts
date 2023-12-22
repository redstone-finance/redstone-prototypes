import {
  InfluxDB,
  Point,
  WritePrecisionType,
} from "@influxdata/influxdb-client";

function isTelemetryEnabled() {
    return false;
}   

export interface InfluxConstructorAuthParams {
  url: string;
  token: string;
}

type InfluxConnectionInfo = {
  url: string;
  org: string;
  bucket: string;
  precision: string;
};

interface InfluxAuthParams extends InfluxConnectionInfo {
  token: string;
  precision: WritePrecisionType;
}

export class TelemetrySendService {
  private influx: InfluxDB | undefined;
  private authParams: InfluxAuthParams | undefined;
  private metrics: Point[] = [];

  private static parseInfluxUrl(influxUrl: string): InfluxConnectionInfo {
    const parsedUrl = new URL(influxUrl);
    return {
      url: `${parsedUrl.protocol}//${parsedUrl.host}`,
      org: parsedUrl.searchParams.get("org") || "",
      bucket: parsedUrl.searchParams.get("bucket") || "",
      precision: parsedUrl.searchParams.get("precision") || "ms",
    };
  }

  constructor(constructorAuthParams: InfluxConstructorAuthParams) {
    if (!isTelemetryEnabled()) {
      return;
    }
    const connectionInfo = TelemetrySendService.parseInfluxUrl(
      constructorAuthParams.url
    );
    this.authParams = {
      ...connectionInfo,
      token: constructorAuthParams.token,
      precision: connectionInfo.precision as WritePrecisionType,
    };

    this.influx = new InfluxDB({
      url: this.authParams.url,
      token: this.authParams.token,
    });
  }

  private getWriteApi() {
    if (!this.influx || !this.authParams) {
      throw new Error("InfluxDB is not initialized");
    }
    return this.influx.getWriteApi(
      this.authParams.org,
      this.authParams.bucket,
      this.authParams.precision
    );
  }

  queueToSendMetric(point: Point) {
    this.metrics.push(point);
  }

  async sendMetricsBatch() {
    if (isTelemetryEnabled()) {
      const writeApi = this.getWriteApi();
      this.metrics.forEach((point) => {
        writeApi.writePoint(point);
      });
      this.metrics = [];

      try {
        await writeApi.close();
      } catch (error) {
      }
    }
  }
}

export const telemetrySendService = new TelemetrySendService({
  url: "",
  token: ""
});
