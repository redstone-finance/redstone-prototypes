v = {timeRangeStart: -7d, timeRangeStop: -9h}

windowPeriodString = "30h"
windowPeriod = duration(v: windowPeriodString)
// windowPeriod = duration(v: "${windowPeriod}")

from(bucket: "redstone")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  // only gas field because one update creates multiple records (each with different field)
  |> filter(fn: (r) => r["_measurement"] == "onChainRelayersTransactions" and r["_field"] == "gas") 
  |> keep (columns: ["relayerName", "_time", "_value"])
  |> aggregateWindow(every: windowPeriod, fn: count)
  |> group(columns: ["relayerName"])
  |> yield(name: "basic health")