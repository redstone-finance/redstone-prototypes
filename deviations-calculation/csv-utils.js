import fs from "fs";

function writeCsvFile(filename, csvData) {
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filename);
    stream.write(csvData, "utf-8");
    stream.end();
    stream.on("finish", () => {
      resolve();
    });
    stream.on("error", (error) => {
      reject(error);
    });
  });
}

export { writeCsvFile };
