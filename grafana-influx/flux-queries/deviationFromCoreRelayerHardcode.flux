import "strings"
import "array"

v = {timeRangeStart: -4d, timeRangeStop: -1m}

windowPeriodString = "20m"
windowPeriod = duration(v: windowPeriodString)
// windowPeriod = duration(v: "${windowPeriod}")

filterPeriod = 20m

calculateDeviationPercentage = (value1, value2) => {
  return (value1 - value2) / value2 * 100.0
}

relayerStream = from(bucket: "redstone")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => 
    r["_measurement"] == "onChainRelayersTransactions" and 
    strings.hasPrefix(v: r._field, prefix: "value-")
  )
  |> aggregateWindow(every: filterPeriod, fn: mean, createEmpty: false)
  |> map(fn: (r) => ({r with dataFeedId: strings.substring(v: r._field, start: 6, end: 30)}))
  |> keep(columns: ["_time", "_value", "dataFeedId", "relayerName" ])
  |> group(columns: ["dataFeedId"])


uniqueDataFeedIds = relayerStream
  |> keep(columns: ["dataFeedId"])
  |> unique(column: "dataFeedId")
  |> array.to()
//   |> yield(name: "relayerStream")

// //write it as array
// arrayDataFeedIds = array.from(rows: uniqueDataFeedIds)

valueStream = from(bucket: "core-mean")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) =>
    r._measurement == "dataPackages" and
    r._field == "value" and
    contains(value: r.dataFeedId, set: uniqueDataFeedIds) and
    // r.dataFeedId EXIST IN uniqueDataFeedIds and
    r.dataFeedId != "___ALL_FEEDS___"
  )
  |> keep(columns: ["_time", "_value", "dataFeedId", "dataServiceId"])
  |> aggregateWindow(every: filterPeriod, fn: mean, createEmpty: false)
  |> keep(columns: ["_time", "_value", "dataFeedId", "dataServiceId"])
  |> group(columns: ["dataFeedId"])
  |> yield(name: "valueStream")

// // Pobierz dane z valueStream i zapisz je do zmiennej "valueData"
// valueData = from(bucket: "core-mean")
//   |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
//   |> filter(fn: (r) =>
//     r._measurement == "dataPackages" and
//     r._field == "value" and
//     r.dataFeedId != "___ALL_FEEDS___"
//   )
//   |> keep(columns: ["_time", "_value", "dataFeedId", "dataServiceId"])
//   |> group(columns: ["dataFeedId"])

// // Utwórz pustą tabelę wynikową
// resultTable = table()

// // Iteruj przez unikalne dataFeedId
// uniqueDataFeedIds = unique(column: "dataFeedId", table: valueData)

// for dataFeedId in uniqueDataFeedIds do
//   // Filtruj dane dla danego dataFeedId
//   filteredValueData = filter(fn: (r) => r.dataFeedId == dataFeedId, table: valueData)
  
//   // Dołącz dane z relayerData
//   joined = join(
//     tables: {r: relayerData, v: filteredValueData},
//     on: ["_time", "dataFeedId"],
//   )
  
//   // Oblicz odchylenie i przekształć dane
//   mapped = joined
//     |> map(fn: (r) => ({r with _value: calculateDeviationPercentage(value1: r._value_r, value2: r._value_v)}))
  
//   // Dołącz dane do wynikowej tabeli
//   resultTable = union(tables: [resultTable, mapped])
// end

// resultTable
//   |> aggregateWindow(every: windowPeriod, fn: mean, createEmpty: false)
//   |> keep(columns: ["_time", "_value", "dataFeedId", "relayerName", "dataServiceId"])
//   |> group(columns: ["dataFeedId", "relayerName", "dataServiceId"])
//   |> yield(name: "deviation")














// valueStream = from(bucket: "core-mean")
//   |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
//   |> filter(fn: (r) =>
//     r._measurement == "dataPackages" and
//     r._field == "value" and
//     r.dataFeedId != "___ALL_FEEDS___"
//   )
//   |> keep(columns: ["_time", "_value", "dataFeedId", "dataServiceId"])
//   |> aggregateWindow(every: filterPeriod, fn: mean, createEmpty: false)
//   |> keep(columns: ["_time", "_value", "dataFeedId", "dataServiceId"])
//   |> group(columns: ["dataFeedId"])



// joined = join(
//   tables: {r: relayerStream, v: valueStream},
//   on: ["_time", "dataFeedId"],
// )

// joined
//   |> map(fn: (r) => ({r with _value: calculateDeviationPercentage(value1: r._value_r, value2: r._value_v)}))
//   |> keep(columns: ["_time", "_value", "dataFeedId", "relayerName", "dataServiceId"])
//   |> aggregateWindow(every: windowPeriod, fn: mean, createEmpty: false)
//   |> keep(columns: ["_time", "_value", "dataFeedId", "relayerName", "dataServiceId"])
//   |> group(columns: ["dataFeedId", "relayerName", "dataServiceId"])
//   |> yield(name: "deviation")