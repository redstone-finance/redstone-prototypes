import redstone from "redstone-api";

async function analyzeDeviations(token: string) {
  const pricesData: any = await redstone.getHistoricalPrice(token, {
    startDate: "2023-07-12T23:00:01",
    endDate: "2023-07-14T04:00:00",
    interval: 600 * 1000, // 10 minutes
  });

  const sourceMinMax: { [key: string]: { min: number; max: number } } = {};

  for (const priceData of pricesData) {
    const sources = priceData.source;

    for (const key in sources) {
      const value = sources[key];

      if (!sourceMinMax[key]) {
        sourceMinMax[key] = { min: value, max: value };
      } else {
        if (value > sourceMinMax[key].max) {
          sourceMinMax[key].max = value;
        }
        if (value < sourceMinMax[key].min) {
          sourceMinMax[key].min = value;
        }
      }
    }
  }

  for (const sourceKey in sourceMinMax) {
    const { min, max } = sourceMinMax[sourceKey];
    console.log(`Source: ${sourceKey}`);
    console.log(`Min Price: ${min}`);
    console.log(`Max Price: ${max}`);
    console.log(
      `Difference deviation: ${(((max - min) / min) * 100).toFixed(2)}%`
    );
  }

  // for (const priceData of pricesData) {
  //   const sources = priceData.source;
  //   const price = priceData.value;
  //   let [min, max] = [price, price];
  //   let [minSource, maxSource] = ["", ""];

  //   for (const key in sources) {
  //     const value = sources[key];
  //     if (value > max) {
  //       max = value;
  //       maxSource = key;
  //     }
  //     if (value < min) {
  //       min = value;
  //       minSource = key;
  //     }
  //   }
  //   console.log(`Difference deviation for token: ${(max - min) / price}`);
  //   console.log(`Min source: ${minSource}`);
  //   console.log(`Max source: ${maxSource}`);
  // }
}

const token = process.argv[2];
if (token) {
  analyzeDeviations(token);
} else {
  console.error("Please provide the token name (e.g. ADA, MATIC).");
}
