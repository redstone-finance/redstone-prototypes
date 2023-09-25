// todo: add this to Variables in grafana and remove the hardcoding
v = {timeRangeStart: -2d, timeRangeStop: -1m}
dataServiceId = "redstone-primary-prod" 
// dataServiceId = "${queryDataServiceId}"
// windowPeriod = duration(v: "${windowPeriod}")

windowPeriod = 1m

signerStream = from(bucket: "redstone")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) =>
    r.dataServiceId == dataServiceId and
    r._measurement == "dataPackages" and
    r._field == "value" and
    r.dataFeedId == "___ALL_FEEDS___"
  )
  |> keep(columns: ["_time", "_value", "signerAddress"])
  |> group(columns: ["signerAddress"])
  |> aggregateWindow(every: windowPeriod, fn: count, createEmpty: true)
  |> keep(columns: ["_time", "_value", "signerAddress"])
  |> yield(name: "missingPackages")
