v = {timeRangeStart: -7d, timeRangeStop: -9h}

windowPeriodString = "3h"
windowPeriod = duration(v: windowPeriodString)
// windowPeriod = duration(v: "${windowPeriod}")

from(bucket: "redstone")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "onChainRelayersTransactions")
  |> keep (columns: ["relayerName", "_time", "_value"])
  |> aggregateWindow(every: windowPeriod, fn: count)
  |> group(columns: ["relayerName"])
  |> yield(name: "basic health")