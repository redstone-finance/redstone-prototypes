from(bucket: "redstone")
  |> range(start: -90d)
  |> filter(fn: (r) => r["_measurement"] == "onChainRelayersTransactions")
  |> keep(columns: ["relayerName"])
  |> group()
  |> distinct(column: "relayerName")
  |> yield(name: "relayerName")
  