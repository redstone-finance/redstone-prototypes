SELECT
    DATE_TRUNC({{time_granularity}}, block_time) as "date",
    to as "contract",
    COUNT(DISTINCT tx_hash) as "txns"
FROM
    arbitrum.traces tr
WHERE
    block_time >= TIMESTAMP {{start_date}}
    and block_time <= TIMESTAMP {{end_date}}
    and success
    and to = ANY (VALUES
        0x50db815D3c4B869F89925690E936ED85b0b76075, -- PREMIA-TWAP-60, arbitrumPremia
        0xAD17b1bc8Ad4fbF3201CC59AFa94f951097662Af, -- SWETH, arbitrumSwellSweth
        0xd2F9EB49F563aAacE73eb1D19305dD5812F33179, -- VST, vesta
        0x5908A61E8f88F56a772a0E5eD5f5c8264Fcf1A75, -- SOFR, voltzArb
        0x2b28608Eb3c1b49EB9ebD528F5F4af4e36861784, -- SOFR_EFFECTIVE_DATE, voltzArb
        0xC2597d9814FA26623a538840954aA3ea469EBAC3, -- SOFRAI, voltzArb
        0xeeea43031F7E80753943bAdE67EEaaDE80Ba6390 -- SOFRAI_EFFECTIVE_DATE, voltzArb
    )
    and bytearray_substring(input,1,4) = ANY (VALUES
        0xfeaf968c, -- latestRoundData()
        0x9a6fc8f5,-- getRoundData(uint80)
        0x668a0f02, -- latestRound()
        0x50d25bcd -- latestAnswer()
    )
GROUP BY 1, 2
ORDER BY date, txns