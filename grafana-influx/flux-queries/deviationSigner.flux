import "strings"

// todo: add this to Variables in grafana and remove the hardcoding
v = {timeRangeStart: -15h, timeRangeStop: -9h}
dataServiceId = "redstone-primary-prod" 
dataFeedId = "ETH"
signerAddress = "0x51Ce04Be4b3E32572C4Ec9135221d0691Ba7d202"
// dataServiceId = "${queryDataServiceId}"
// dataFeedId = "${queryDataFeedId}"
// signerAddress = "${querySignerAddress}"

windowPeriod = 15m

calculateDeviationPercentage = (value1, value2) => {
  return (value1 - value2) / value2 * 100.0
}

valueStream = from(bucket: "redstone")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "dataPackages" and r.dataServiceId == dataServiceId and r.signerAddress == signerAddress and r.dataFeedId == dataFeedId and r["_field"] == "value")
  |> aggregateWindow(every: windowPeriod, fn: mean, createEmpty: false)
  |> keep(columns: ["_time", "_value"])
  // |> yield(name: "valueStream")

sourcesStream = from(bucket: "redstone")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "dataPackages" and r.dataServiceId == dataServiceId and r.signerAddress == signerAddress and r.dataFeedId == dataFeedId)
  |> filter(fn: (r) => strings.hasPrefix(v: r["_field"], prefix: "value") and not strings.hasPrefix(v: r["_field"], prefix: "value-slippage"))
  |> aggregateWindow(every: windowPeriod, fn: mean, createEmpty: false)
  |> keep(columns: ["_time", "_field", "_value"])
  // |> yield(name: "sourcesStream")

joined = join(
  tables: {v: valueStream, s: sourcesStream},
  on: ["_time"]
)

joined
  // |> yield(name: "joined")
  |> map(fn: (r) => ({
      _time: r._time,
      deviationPercentage: calculateDeviationPercentage(value1: r._value_s, value2: r._value_v),
      sourceField: r._field,
  }))
  |> group(columns: ["sourceField"])
  |> yield(name: "deviationPercentage")
