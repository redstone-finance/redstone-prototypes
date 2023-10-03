import "strings"
import "join"

// todo: add this to Variables in grafana and remove the hardcoding
v = {timeRangeStart: -3d, timeRangeStop: -1m}
dataServiceId = "redstone-primary-prod" 
signerAddress = "0x51Ce04Be4b3E32572C4Ec9135221d0691Ba7d202"
dataFeedId = ["ETH"]
// dataServiceId = "${queryDataServiceId}"
// signerAddress = "${querySignerAddress}"
// dataFeedIdString = "${queryDataFeedId:pipe}"
// dataFeedId = strings.split(v: dataFeedIdString, t: "|")
// windowPeriod = duration(v: "${windowPeriod}")

windowPeriod = 30m

calculateDeviationPercentage = (value1, value2) => {
  return (value1 - value2) / value2 * 100.0
}

valueStream = from(bucket: "core-mean")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) =>
    r.dataServiceId == dataServiceId and
    r.signerAddress == signerAddress and
    r._measurement == "dataPackages" and
    r._field == "value" and
    // contains(value: r.dataFeedId, set: dataFeedId) and
    r.dataFeedId != "___ALL_FEEDS___"
  )
  |> keep(columns: ["_time", "_value", "dataFeedId"])
  |> aggregateWindow(every: windowPeriod, fn: mean, createEmpty: false)
  |> keep(columns: ["_time", "_value", "dataFeedId"])
  |> group(columns: ["dataFeedId"])
  |> yield(name: "value")

sourcesStream = from(bucket: "core-mean")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) =>
    r.signerAddress == signerAddress and
    r.dataServiceId == dataServiceId and
    r._measurement == "dataPackages" and
    r.dataFeedId != "___ALL_FEEDS___" and
    // contains(value: r.dataFeedId, set: dataFeedId) and
    strings.hasPrefix(v: r["_field"], prefix: "value") and
    not strings.hasPrefix(v: r["_field"], prefix: "value-slippage")
  )
  |> keep(columns: ["_time", "_field", "_value", "dataFeedId"])
  |> aggregateWindow(every: windowPeriod, fn: mean, createEmpty: false)
  |> keep(columns: ["_time", "_field", "_value", "dataFeedId"])
  |> group(columns: ["dataFeedId"])
  |> yield(name: "sources")

joined = join.left(
  left: sourcesStream,
  right: valueStream,
  on: (l,r) => l.dataFeedId == r.dataFeedId and l._time == r._time,
  as: (l,r) => ({
    _time: l._time, 
    sourceField: l._field, 
    _value: calculateDeviationPercentage(value1: l._value, value2: r._value),
    dataFeedId: l.dataFeedId
  })
)

joined
  |> group(columns: ["sourceField", "dataFeedId"])
  |> yield(name: "deviationPercentage")
