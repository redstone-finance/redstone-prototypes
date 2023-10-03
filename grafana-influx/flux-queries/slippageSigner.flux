import "strings"

// todo: add this to Variables in grafana and remove the hardcoding
v = {timeRangeStart: -6h, timeRangeStop: -1m}
windowPeriod = 3h
dataServiceId = "redstone-primary-prod" 
signerAddress = "0x51Ce04Be4b3E32572C4Ec9135221d0691Ba7d202"
// dataServiceId = "${queryDataServiceId}"
// signerAddress = "${querySignerAddress}"
// windowPeriod = duration(v: "${windowPeriod}")

from(bucket: "core-mean")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) =>
    r.signerAddress == signerAddress and
    r.dataServiceId == dataServiceId and
    r._measurement == "dataPackages" and
    r.dataFeedId != "___ALL_FEEDS___" and
    strings.hasPrefix(v: r["_field"], prefix: "value-slippage") 
  )
  |> keep(columns: ["_time", "_field", "_value", "dataFeedId"])
  |> aggregateWindow(every: windowPeriod, fn: mean, createEmpty: false)
  |> keep(columns: ["_time", "_field", "_value", "dataFeedId"])
  |> group(columns: ["dataFeedId", "_field"])
  |> yield(name: "slippagePerDataFeed")
