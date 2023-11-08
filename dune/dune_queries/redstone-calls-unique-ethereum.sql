WITH 
    ethereum_calls as (
        SELECT
            DISTINCT("from")
        FROM
            ethereum.traces tr
        WHERE
            block_time >= TIMESTAMP {{start_date}}
            -- and block_time <= TIMESTAMP {{end_date}}
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
    )
    
    , from_table as (
        SELECT 0x89f1eccf2644902344db02788a790551bb070351 as "from", 'Gravita Protocol' as "name"
        UNION ALL
        SELECT 0xecb97207d588f334d7d06b99acf9d85c11a47732 as "from", 'Raft Protocol' as "name"
        UNION ALL
        SELECT 0x00253582b2a3fe112feec532221d9708c64cefab as "from", 'Angle Protocol' as "name"
        UNION ALL
        SELECT 0x3c7f8bd43842da23889cc5564ef2807233c9de2e as "from", 'Raft Protocol' as "name"
    )
    
SELECT
    ec."from",
    COALESCE(ft."name", '????') as "Project Name"
FROM
    ethereum_calls ec
LEFT JOIN
    from_table ft
ON
    ec."from" = ft."from"