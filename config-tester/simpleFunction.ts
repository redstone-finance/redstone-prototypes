export function getQuotedTokenSymbol(quotedTokenWithNumber: string): string {
  const regex = /^[a-zA-Z/]+/;
  const match = quotedTokenWithNumber.match(regex);
  if (!match) {
    throw new Error(
      `Invalid quoted token symbol: ${quotedTokenWithNumber} does not match regex ${regex} in getQuotedTokenSymbol function in DexConfig.ts`
    );
  }
  return match[0];
  // return quotedTokenWithNumber.split("-")[0];
}

// test function
console.log(getQuotedTokenSymbol("PrEmia/TWaP-1"));
