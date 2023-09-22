import "join"
v = {timeRangeStart: -30h, timeRangeStop: -1m}

windowPeriodString = "1m"
windowPeriod = duration(v: windowPeriodString)
// windowPeriod = duration(v: "${windowPeriod}")
relayerName = "voltz"
dataServiceId = "redstone-avalanche-prod" 
dataFeedId = "SOFR"
// relayerName = "${queryRelayerName}"
// dataServiceId = "${queryDataServiceId}"
// dataFeedId = "${queryCommonFeedId}"
relayerField = "value-" + dataFeedId


calculateDeviationPercentage = (value1, value2) => {
  return (value1 - value2) / value2 * 100.0
}

valueStream = from(bucket: "redstone")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "dataPackages" and r.dataServiceId == dataServiceId and r.dataFeedId == dataFeedId and r["_field"] == "value")
  |> aggregateWindow(every: 1m, fn: mean, createEmpty: false)
  |> keep(columns: ["_time", "_value"])

relayerStream = from(bucket: "redstone")
  |> range(start: v.timeRangeStart)
  |> filter(fn: (r) => r["_measurement"] == "onChainRelayersTransactions" and r.relayerName == relayerName and r._field == relayerField)
  |> aggregateWindow(every: 1m, fn: mean, createEmpty: true)
  |> keep(columns: ["_time", "_value"])

joined = join.left(
  left: valueStream,
  right: relayerStream,
  on: (l,r) => l._time == r._time,
  as: (l,r) => ({_time: l._time, _value: l._value, _value_relayer: r._value})
) 
  |> fill(column: "_value_relayer", usePrevious: true)
  |> filter(fn: (r) => r._value_relayer != 0.0)

joined
  |> map(fn: (r) => ({r with _value: calculateDeviationPercentage(value1: r._value, value2: r._value_relayer)}))
  |> aggregateWindow(every: windowPeriod, fn: mean, createEmpty: false)
  |> keep(columns: ["_time", "_value"])
  |> yield(name: "deviation")