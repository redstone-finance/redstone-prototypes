SELECT
    DATE_TRUNC({{time_granularity}}, block_time) as "date",
    to as "contract",
    COUNT(DISTINCT tx_hash) as "txns"
FROM
    ethereum.traces tr
WHERE
    block_time >= TIMESTAMP {{start_date}}
    and block_time <= TIMESTAMP {{end_date}}
    and success
    and to = ANY (VALUES
        0x6E27A25999B3C665E44D903B2139F5a4Be2B6C26, -- C3M, angle
        0xFaBEb1474C2Ab34838081BFdDcE4132f640E7D2d, -- ETHx, staderEthx
        0x0704eEc81ea7CF98Aa4A400c65DC4ED5933bddf7, -- SWETH, swell
        0x061bB36F8b67bB922937C102092498dcF4619F86 -- SWETH/ETH, swell
    )
    and bytearray_substring(input,1,4) = ANY (VALUES
        0xfeaf968c, -- latestRoundData()
        0x9a6fc8f5,-- getRoundData(uint80)
        0x668a0f02, -- latestRound()
        0x50d25bcd -- latestAnswer()
    )
GROUP BY 1, 2
ORDER BY date, txns