v = {timeRangeStart: -60h, timeRangeStop: -2h}

windowPeriodString = "3h"
windowPeriod = duration(v: windowPeriodString)
// windowPeriod = duration(v: "${windowPeriod}")

dataServiceId = "redstone-primary-prod" 
dataFeedId = "ETH"
relayerName = "vesta"
// dataServiceId = "${queryDataServiceId}"
// dataFeedID = "${queryDataFeedID}"
// relayerName = "${queryRelayerName}"


calculateDeviationPercentage = (value1, value2) => {
  return (value1 - value2) / value2 * 100.0
}

// valueStream = from(bucket: "redstone")
//   |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
//   |> filter(fn: (r) => r["_measurement"] == "dataPackages" and r.dataServiceId == dataServiceId and r.dataFeedId == dataFeedId and r["_field"] == "value")
// //   |> aggregateWindow(every: windowPeriod, fn: mean, createEmpty: false)
//   |> keep(columns: ["_time", "_value"])
//   |> yield(name: "valueStream")

relayerStream = from(bucket: "redstone")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "onChainRelayersTransactions" and r.relayerName == relayerName)
//   |> keep (columns: ["_field"])
//   |> group()
//   |> distinct(column: "_field")
//   |> keep (columns: ["_measurment"])
//   |> group()
//   |> distinct(column: "_fie")

// _field: txPreparationTimestamp
//   |> filter(fn: (r) => r._field == "txPreparationTimestamp")
//   |> keep (columns: ["_time", "_value"])
//   |> aggregateWindow(every: windowPeriod, fn: count)
  |> yield(name: "relayerStream")