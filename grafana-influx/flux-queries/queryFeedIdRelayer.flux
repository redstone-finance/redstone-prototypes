import "strings"
relayerName = "vesta"
// relayerName = "${queryRelayerName}"

from(bucket: "redstone")
  |> range(start: -90d)
  |> filter(fn: (r) => r["_measurement"] == "onChainRelayersTransactions" and r["relayer"] == relayerName)
  |> keep(columns: ["_field"])
  |> filter(fn: (r) => r["_field"] =~ /^value-/)
  |> group()
  |> distinct(column: "_field")
  |> map(fn: (r) => ({r with _value: strings.substring(v: r._value, start: 6, end: 30)}))
  |> yield(name: "dataFeedIdRelayer")
