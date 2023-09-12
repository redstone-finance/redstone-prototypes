import "strings"

// todo: add this to Variables in grafana and remove the hardcoding
v = {timeRangeStart: -12h, timeRangeStop: -9h}
dataServiceId = "redstone-primary-prod" 
dataFeedId = "SWETH"
// dataServiceId = "${dataServiceId}"
// dataFeedId = "${dataFeedId}"

windowPeriod = 15m

valueStream = from(bucket: "redstone")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "dataPackages" and r.dataServiceId == dataServiceId and r.dataFeedId == dataFeedId and r["_field"] == "value")
  |> aggregateWindow(every: windowPeriod, fn: mean, createEmpty: false)
  // |> yield(name: "valueStream")

sourcesStream = from(bucket: "redstone")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "dataPackages" and r.dataServiceId == dataServiceId and r.dataFeedId == dataFeedId)
  |> filter(fn: (r) => strings.hasPrefix(v: r["_field"], prefix: "value"))
  |> aggregateWindow(every: windowPeriod, fn: mean, createEmpty: false)
  |> map(fn: (r) => ({ r with sourceField: r["_field"] }))
  // |> yield(name: "sourcesStream")

joined = join(
  tables: {v: valueStream, s: sourcesStream},
  on: ["_time", "dataServiceId", "dataFeedId"]
)

joined
  |> map(fn: (r) => ({
      _time: r._time,
      deviationPercentage: (r._value_s - r._value_v) / r._value_v * 100.0,
      sourceField: r.sourceField
  }))
  |> group(columns: ["sourceField"])
  |> yield(name: "deviationPercentage")
