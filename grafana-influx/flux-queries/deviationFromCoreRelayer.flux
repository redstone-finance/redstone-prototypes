import "strings"

v = {timeRangeStart: -3d, timeRangeStop: -1m}

windowPeriodString = "30m"
windowPeriod = duration(v: windowPeriodString)
// windowPeriod = duration(v: "${windowPeriod}")

filterPeriod = 5m

calculateDeviationPercentage = (value1, value2) => {
  return (value1 - value2) / value2 * 100.0
}

valueStream = from(bucket: "redstone")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "dataPackages" and r["_field"] == "value")
  |> keep(columns: ["_time", "_value", "dataFeedId", "dataServiceId"])
  |> aggregateWindow(every: filterPeriod, fn: mean, createEmpty: false)
  |> keep(columns: ["_time", "_value", "dataFeedId", "dataServiceId"])
  |> group(columns: ["dataFeedId"])

relayerStream = from(bucket: "redstone")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => 
    r["_measurement"] == "onChainRelayersTransactions" and 
    strings.hasPrefix(v: r._field, prefix: "value-")
  )
  |> aggregateWindow(every: filterPeriod, fn: mean, createEmpty: false)
  |> map(fn: (r) => ({r with dataFeedId: strings.substring(v: r._field, start: 6, end: 30)}))
  |> keep(columns: ["_time", "_value", "dataFeedId", "relayerName" ])
  |> group(columns: ["dataFeedId"])


joined = join(
  tables: {r: relayerStream, v: valueStream},
  on: ["_time", "dataFeedId"],
)

joined
  |> map(fn: (r) => ({r with _value: calculateDeviationPercentage(value1: r._value_r, value2: r._value_v)}))
  |> keep(columns: ["_time", "_value", "dataFeedId", "relayerName", "dataServiceId"])
  |> aggregateWindow(every: windowPeriod, fn: mean, createEmpty: false)
  |> keep(columns: ["_time", "_value", "dataFeedId", "relayerName", "dataServiceId"])
  |> group(columns: ["dataFeedId", "relayerName", "dataServiceId"])
  |> yield(name: "deviation")