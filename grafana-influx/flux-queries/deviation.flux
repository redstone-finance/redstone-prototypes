import "strings"

// todo: add this to Variables in grafana and remove the hardcoding
v = {timeRangeStart: -12h, timeRangeStop: -9h}
dataServiceId = "redstone-primary-prod" 
dataFeedId = "SWETH"
// dataServiceId = "${dataServiceId}"
// dataFeedId = "${dataFeedId}"

windowPeriod = 15m

calculateDeviationPercentage = (value1, value2) => {
  return (value1 - value2) / value2 * 100.0
}

valueStream = from(bucket: "redstone")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "dataPackages" and r.dataServiceId == dataServiceId and r.dataFeedId == dataFeedId and r["_field"] == "value")
  |> aggregateWindow(every: windowPeriod, fn: mean, createEmpty: false)
  |> keep(columns: ["_time", "_value", "signerAddress"])
  // |> yield(name: "valueStream")

sourcesStream = from(bucket: "redstone")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "dataPackages" and r.dataServiceId == dataServiceId and r.dataFeedId == dataFeedId)
  |> filter(fn: (r) => strings.hasPrefix(v: r["_field"], prefix: "value") and not strings.hasPrefix(v: r["_field"], prefix: "value-slippage"))
  |> aggregateWindow(every: windowPeriod, fn: mean, createEmpty: false)
  |> keep(columns: ["_time", "_field", "_value", "signerAddress"])
  // |> yield(name: "sourcesStream")

joined = join(
  tables: {v: valueStream, s: sourcesStream},
  on: ["_time", "signerAddress"]
)

joined
  // |> yield(name: "joined")
  |> map(fn: (r) => ({
      _time: r._time,
      deviationPercentage: calculateDeviationPercentage(value1: r._value_s, value2: r._value_v),
      sourceField: r._field,
      signerAddress: r.signerAddress
  }))
  |> group(columns: ["sourceField"])
  |> group(columns: ["signerAddress"])
  |> yield(name: "deviationPercentage")
