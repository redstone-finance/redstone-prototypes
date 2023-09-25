v = {timeRangeStart: -1d, timeRangeStop: -9h}

windowPeriodString = "3h"
windowPeriod = duration(v: windowPeriodString)
// windowPeriod = duration(v: "${windowPeriod}")

transactionTime =from(bucket: "redstone")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "onChainRelayersTransactions" and r["_field"] == "txPreparationTimestamp") 
  |> keep (columns: ["relayerName", "_time", "_value"])
  |> map(fn: (r) => ({
      _time: r._time,
      relayerName: r.relayerName,
       _value: (int(v: r._time) - int(v: r._value)*1000000 ) / 1000000
  }))
  |> group(columns: ["relayerName"])

minInPeriod = transactionTime
  |> aggregateWindow(every: windowPeriod, fn: min, createEmpty: false)
  |> yield(name: "minTime")

maxInPeriod = transactionTime
  |> aggregateWindow(every: windowPeriod, fn: max, createEmpty: false)
  |> yield(name: "maxTime")

avgInPeriod = transactionTime
  |> aggregateWindow(every: windowPeriod, fn: mean, createEmpty: false)
  |> yield(name: "avgTime")