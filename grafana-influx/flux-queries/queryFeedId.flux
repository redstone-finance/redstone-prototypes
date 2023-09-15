dataServiceId = "redstone-primary-prod" 
// dataServiceId = "${queryDataServiceId}"

from(bucket: "redstone")
  |> range(start: -7d)
  |> filter(fn: (r) => r["_measurement"] == "dataPackages" and r.dataServiceId == dataServiceId)
  |> keep(columns: ["dataFeedId"])
  |> group()
  |> distinct(column: "dataFeedId")
  |> filter(fn: (r) => r._value != "___ALL_FEEDS___")
  |> yield(name: "dataFeedId")
