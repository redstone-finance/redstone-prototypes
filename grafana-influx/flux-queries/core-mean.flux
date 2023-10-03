import "strings"
windowPeriod = 10m

data = from(bucket: "redstone")
  |> range(start: -1h)
  |> filter(fn: (r) =>
    r._measurement == "dataPackages" and
    r.dataFeedId != "___ALL_FEEDS___" and
    strings.hasPrefix(v: r["_field"], prefix: "value")
  )

data
  |> aggregateWindow(every: windowPeriod, fn: mean, createEmpty: false)
  |> to(bucket: "core-mean", org: "redstone")
  |> yield(name: "mean")