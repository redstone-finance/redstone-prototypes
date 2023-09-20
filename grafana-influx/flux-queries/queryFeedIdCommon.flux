import "strings"
relayerName = "voltz"
dataServiceId = "redstone-avalanche-prod" 
// relayerName = "${queryRelayerName}"
// dataServiceId = "${queryDataServiceId}"

feedIdsService = from(bucket: "redstone")
  |> range(start: -7d)
  |> filter(fn: (r) => r["_measurement"] == "dataPackages" and r.dataServiceId == dataServiceId)
  |> keep(columns: ["dataFeedId"])
  |> group()
  |> distinct(column: "dataFeedId")
  |> filter(fn: (r) => r._value != "___ALL_FEEDS___")

feedIdsRelayer = from(bucket: "redstone")
  |> range(start: -90d)
  |> filter(fn: (r) => r["_measurement"] == "onChainRelayersTransactions" and r.relayerName == relayerName)
  |> keep(columns: ["_field"])
  |> filter(fn: (r) => r["_field"] =~ /^value-/)
  |> group()
  |> distinct(column: "_field")
  |> map(fn: (r) => ({r with _value: strings.substring(v: r._value, start: 6, end: 30)}))

join(tables: {feedIdsService: feedIdsService, feedIdsRelayer: feedIdsRelayer}, on: ["_value"], method: "inner")
  |> yield(name: "commonFeeds")
