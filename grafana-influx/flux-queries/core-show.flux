from(bucket: "core-mean")
  |> range(start: -20m)
  |> yield(name: "mean")
