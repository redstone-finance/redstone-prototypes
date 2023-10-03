import "strings"
import "join"

// dataServiceId = "redstone-avalanche-prod" 
// // array of relayer names or array of dataFeedIds
// dataFeedIds = ["SOFR", "SOFRAI", "SOFR_EFFECTIVE_DATE", "SOFRAI_EFFECTIVE_DATE"]

// dataServiceId = "redstone-arbitrum-prod" 
// // // array of relayer names or array of dataFeedIds
// dataFeedIds = []



dataServiceId = "redstone-primary-prod" 
// array of relayer names or array of dataFeedIds
dataFeedIds = ["C3M", "SWETH", "TRX", "VST", "SOFR", "SOFRAI", "SOFR_EFFECTIVE_DATE", "SOFRAI_EFFECTIVE_DATE"]

windowPeriod = 30m
v = {timeRangeStart: -4d, timeRangeStop: -1m}
// windowPeriod = duration(v: "${windowPeriod}")
filterPeriod = 10m

calculateDeviationPercentage = (value1, value2) => {
  return (value1 - value2) / value2 * 100.0
}

valueStream = from(bucket: "core-mean")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) =>
    r._measurement == "dataPackages" and
    r._field == "value" and
    r.dataServiceId == dataServiceId and
    contains(value: r.dataFeedId, set: dataFeedIds)
  )
  |> keep(columns: ["_time", "_value", "dataFeedId"])
  |> aggregateWindow(every: filterPeriod, fn: mean, createEmpty: false)
  |> map(fn: (r) => ({r with _field: r.dataFeedId}))
  |> keep(columns: ["_time", "_value", "_field"])
  |> group(columns: ["_field"])
//   |> yield(name: "valueStream")

relayerStream = from(bucket: "redstone")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => 
    r["_measurement"] == "onChainRelayersTransactions" and 
    strings.hasPrefix(v: r._field, prefix: "value-")
  )
  |> map(fn: (r) => ({r with _field: strings.substring(v: r._field, start: 6, end: 30)}))
  |> filter(fn: (r) => contains(value: r._field, set: dataFeedIds))
  |> keep(columns: ["_time", "_value", "_field", "relayerName" ])
  |> aggregateWindow(every: filterPeriod, fn: mean, createEmpty: false)
  |> keep(columns: ["_time", "_value", "_field", "relayerName" ])
  |> group(columns: ["_field"])
//   |> yield(name: "relayerStream")

joined = join.left(
  left: valueStream,
  right: relayerStream,
  on: (l,r) => l._field == r._field and l._time == r._time,
  as: (l,r) => ({
    _time: l._time, 
    _value_v: l._value,
    _value_r: r._value,
    _field: l._field,
    relayerName: r.relayerName,
  })
)
  |> fill(column: "_value_r", usePrevious: true)
  |> fill(column: "relayerName", usePrevious: true)
  |> filter(fn: (r) => r._value_r != 0.0)
  |> map(fn: (r) => ({r with _value: calculateDeviationPercentage(value1: r._value_r, value2: r._value_v)}))
  |> keep(columns: ["_time", "_value", "_field", "relayerName"])
  

joined
  |> group(columns: ["relayerName", "_field"])
  |> yield(name: "deviationPercentage")
