const stringsToCheck = [
  "0x000002ed57011e0000",
  "0x000002ed57011e1234",
  "0xabcdef0123456789",
  "Hello, world!",
  "Lorem ipsum dolor sit amet",
  "1210x000002ed57011e000012312301923 and more",
  "This string does not contain the target",
  "0x000002ed57011e0000",
  "Another example: 0x000002ed57011e0000",
  "0x000002ed57011e0000 at the end",
];

const targetString = "0x000002ed57011e0000";

for (const str of stringsToCheck) {
  if (str.includes(targetString)) {
    console.log(`Found in: ${str}`);
  } else {
    console.log(`Not found in: ${str}`);
  }
}
