import "strings"
v = {timeRangeStart: 2024-04-24T01:00:00Z, timeRangeStop: 2024-04-24T05:00:00Z, windowPeriod: 1s}
dataServiceId = "redstone-primary-prod" 
dataFeedId = "ezETH/ETH" 

from(bucket: "redstone")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "dataPackages")
  |> filter(fn: (r) => r.dataServiceId == dataServiceId)
  |> filter(fn: (r) => r.dataFeedId == dataFeedId)
  |> filter(fn: (r) => r["_field"] == "value")
  |> group(columns: ["_field"])
  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)
  |> keep(columns: ["_time", "_value"])
  |> yield(name: "values")
