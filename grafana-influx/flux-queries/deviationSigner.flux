import "strings"

// todo: add this to Variables in grafana and remove the hardcoding
v = {timeRangeStart: -12h, timeRangeStop: -9h}
dataServiceId = "redstone-primary-prod" 
signerAddress = "0x51Ce04Be4b3E32572C4Ec9135221d0691Ba7d202"
dataFeedId = ["ETH", "AAVE"]
// dataServiceId = "${queryDataServiceId}"
// signerAddress = "${querySignerAddress}"
// dataFeedIdString = "${queryDataFeedId:pipe}"
// dataFeedId = strings.split(v: dataFeedIdString, t: "|")

windowPeriod = 30m

calculateDeviationPercentage = (value1, value2) => {
  return (value1 - value2) / value2 * 100.0
}

valueStream = from(bucket: "redstone")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "dataPackages" and r.dataServiceId == dataServiceId and r.signerAddress == signerAddress and r["_field"] == "value")
  |> filter(fn: (r) => contains(value: r.dataFeedId, set: dataFeedId))
  // |> filter(fn: (r) => dataFeedId == "" or r.dataFeedId == dataFeedId)
  |> aggregateWindow(every: windowPeriod, fn: mean, createEmpty: false)
  |> keep(columns: ["_time", "_value", "dataFeedId"])
  // |> yield(name: "valueStream")

sourcesStream = from(bucket: "redstone")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "dataPackages" and r.dataServiceId == dataServiceId and r.signerAddress == signerAddress and r.dataFeedId != "___ALL_FEEDS___")
  |> filter(fn: (r) => strings.hasPrefix(v: r["_field"], prefix: "value") and not strings.hasPrefix(v: r["_field"], prefix: "value-slippage"))
  |> filter(fn: (r) => contains(value: r.dataFeedId, set: dataFeedId))
  |> aggregateWindow(every: windowPeriod, fn: mean, createEmpty: false)
  |> keep(columns: ["_time", "_field", "_value", "dataFeedId"])
  // |> yield(name: "sourcesStream")

joined = join(
  tables: {v: valueStream, s: sourcesStream},
  on: ["_time", "dataFeedId"],
)

joined
  // |> yield(name: "joined")
  |> map(fn: (r) => ({
      _time: r._time,
      deviationPercentage: calculateDeviationPercentage(value1: r._value_s, value2: r._value_v),
      sourceField: r._field,
      dataFeedId: r.dataFeedId,
  }))
  |> group(columns: ["sourceField", "dataFeedId"])
  |> yield(name: "deviationPercentage")
