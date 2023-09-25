import "join"
import "strings"

v = {timeRangeStart: -1h, timeRangeStop: -1m}

windowPeriodString = "1m"
windowPeriod = duration(v: windowPeriodString)
// windowPeriod = duration(v: "${windowPeriod}")

calculateDeviationPercentage = (value1, value2) => {
  return (value1 - value2) / value2 * 100.0
}

valueStream = from(bucket: "redstone")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "dataPackages" and r["_field"] == "value")
  |> keep(columns: ["_time", "_value", "dataFeedId"])
  |> filter(fn: (r) => r["dataFeedId"] == "TRX")
  |> aggregateWindow(every: 30m, fn: mean, createEmpty: false)
  |> keep(columns: ["_time", "_value", "dataFeedId"])
  |> yield(name: "valueStream")

relayerStream = from(bucket: "redstone")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => 
    r["_measurement"] == "onChainRelayersTransactions" and 
    strings.hasPrefix(v: r._field, prefix: "value-")
  )
  |> aggregateWindow(every: 30m, fn: mean, createEmpty: false)
  |> map(fn: (r) => ({r with _field: strings.substring(v: r._field, start: 6, end: 30)}))
  |> keep(columns: ["_time", "_value", "_field"])
  |> yield(name: "relayerStream")

//TODO: join properly
joined = join.left(
  left: relayerStream,
  right: valueStream,
  on: (l,r) => l._time == r._time, //and l._field == r.dataFeedId,
  as: (l,r) => ({_time: l._time, _value_relayer: l._value, _value: r._value, _field: l._field})
) 

// //   |> fill(column: "_value_relayer", usePrevious: true)
// //   |> filter(fn: (r) => r._value_relayer != 0.0)

joined
// //   |> map(fn: (r) => ({r with _value: calculateDeviationPercentage(value1: r._value, value2: r._value_relayer)}))
// //   |> aggregateWindow(every: windowPeriod, fn: mean, createEmpty: false)
// //   |> keep(columns: ["_time", "_value"])
  |> yield(name: "deviation")