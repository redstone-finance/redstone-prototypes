dataServiceId = "redstone-primary-prod" 
dataFeedId = "ETH"
// dataServiceId = "${queryDataServiceId}"
// dataFeedId = "${queryDataFeedId}"

from(bucket: "redstone")
  |> range(start: -7d)
  |> filter(fn: (r) => r["_measurement"] == "dataPackages" and r.dataServiceId == dataServiceId and r.dataFeedId == dataFeedId)
  |> keep(columns: ["signerAddress"])
  |> group()
  |> distinct(column: "signerAddress")
  |> yield(name: "signerAddress")