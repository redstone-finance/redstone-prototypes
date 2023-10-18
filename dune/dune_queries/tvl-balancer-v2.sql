WITH 
    volume_24h as (
        SELECT sum(amount_usd) as amount_usd_24h, CAST(project_contract_address as varchar) as project_contract_address
        FROM dex.trades
        WHERE block_time >= cast(now() as timestamp) - interval '1' day
        GROUP BY 2
    )

    , volume_7d as (
        SELECT sum(amount_usd) as amount_usd_7d, CAST(project_contract_address as varchar) as project_contract_address
        FROM dex.trades
        WHERE block_time >= cast(now() as timestamp) - interval '7' day
        GROUP BY 2
    )

SELECT
    rank() over(ORDER BY TVL DESC) AS rank,
    blockchain,
    CONCAT(
        '<a href="https://app.balancer.fi/#/',
        "blockchain",
        '/pool/',
        CAST("poolID" as VARCHAR),
        '" target="_blank">',
        UPPER("name"),
        ' </a>'
    ) as pool,
    CASE 
        WHEN "TVL" IS NULL THEN 0
        ELSE "TVL"
    END AS tvl, 
    CASE 
        WHEN "amount_usd_24h" IS NULL THEN 0
        ELSE "amount_usd_24h"
    END AS "24hs volume $", 
    CASE 
        WHEN "amount_usd_7d" IS NULL THEN 0
        ELSE "amount_usd_7d"
    END AS "7d volume $",
    pool_address
FROM query_2634572
LEFT JOIN volume_24h on volume_24h."project_contract_address" = SUBSTRING(CAST("poolID" as VARCHAR), 1,42)
LEFT JOIN volume_7d on volume_7d."project_contract_address" = SUBSTRING(CAST("poolID" as VARCHAR), 1,42)
WHERE TVL is NOT NULL 
ORDER BY TVL DESC;



blockchain, project, version, token_pair, amount_usd, project_contract_address

