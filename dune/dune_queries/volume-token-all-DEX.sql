-- We could uncomment and use filtering by symbol instead of addresses on different chains but for now Dune has blank fields in it's datasets
-- More about dex.trades in query: 3118961
WITH 
    volume_24h as (
        SELECT blockchain, project, version, sum(amount_usd) as amount_usd_24h, CAST(project_contract_address as varchar) as project_contract_address
        FROM dex.trades
        WHERE block_time >= cast(now() as timestamp) - interval '1' day
        AND ( 0=1 -- Easier to edit
            OR (blockchain = 'polygon' AND (token_bought_address = 0x2C89bbc92BD86F8075d1DEcc58C7F4E0107f286b OR token_sold_address = 0x2C89bbc92BD86F8075d1DEcc58C7F4E0107f286b))
            -- OR (blockchain = 'base' AND (token_bought_address = 0xdd4ac477d7c98a1fca789efdb9c56b14e25bc35d OR token_sold_address = 0xdd4ac477d7c98a1fca789efdb9c56b14e25bc35d))
            -- OR (blockchain = 'ethereum' AND (token_bought_address = 0x3c3a81e81dc49A522A592e7622A7E711c06bf354 OR token_sold_address = 0x3c3a81e81dc49A522A592e7622A7E711c06bf354))
            -- OR (blockchain = 'optimism' AND (token_bought_address = 0x9d669fD9a297Ed34159B0ce61BE0a4d5c6bb8489 OR token_sold_address = 0x9d669fD9a297Ed34159B0ce61BE0a4d5c6bb8489))
            OR (blockchain = 'bnb' AND (token_bought_address = 0x1ce0c2827e2ef14d5c4f29a091d735a204794041 OR token_sold_address = 0x1ce0c2827e2ef14d5c4f29a091d735a204794041))
            OR (blockchain = 'celo' AND (token_bought_address = 0x8e3670fd7b0935d3fe832711debfe13bb689b690 OR token_sold_address = 0x8e3670fd7b0935d3fe832711debfe13bb689b690))
            OR (blockchain = 'avalanche_c' AND (token_bought_address = 0xB57B60DeBDB0b8172bb6316a9164bd3C695F133a OR token_sold_address = 0xB57B60DeBDB0b8172bb6316a9164bd3C695F133a))
            -- OR (blockchain = 'gnosis' AND (token_bought_address = 0x4b1E2c2762667331Bc91648052F646d1b0d35984 OR token_sold_address = 0x4b1E2c2762667331Bc91648052F646d1b0d35984))
            -- OR (blockchain = 'arbitrum' AND (token_bought_address = 0x1Ca6e7eb4Ba052Ac6CB53E2516061F88821C1eC2 OR token_sold_address = 0x1Ca6e7eb4Ba052Ac6CB53E2516061F88821C1eC2))
            OR (blockchain = 'fantom' AND (token_bought_address = 0x511D35c52a3C244E7b8bd92c0C297755FbD89212 OR token_sold_address = 0x511D35c52a3C244E7b8bd92c0C297755FbD89212))
        )
        -- AND (token_bought_symbol = '{{token_symbol}}' OR token_sold_symbol = '{{token_symbol}}')
        GROUP BY blockchain, project, version, project_contract_address
    )

    , volume_7d as (
        SELECT blockchain, project, version, sum(amount_usd) as amount_usd_7d, CAST(project_contract_address as varchar) as project_contract_address
        FROM dex.trades
        WHERE block_time >= cast(now() as timestamp) - interval '7' day
        AND (  0=1 -- Easier to edit
            OR (blockchain = 'polygon' AND (token_bought_address = 0x2C89bbc92BD86F8075d1DEcc58C7F4E0107f286b OR token_sold_address = 0x2C89bbc92BD86F8075d1DEcc58C7F4E0107f286b))
            -- OR (blockchain = 'base' AND (token_bought_address = 0xdd4ac477d7c98a1fca789efdb9c56b14e25bc35d OR token_sold_address = 0xdd4ac477d7c98a1fca789efdb9c56b14e25bc35d))
            -- OR (blockchain = 'ethereum' AND (token_bought_address = 0x3c3a81e81dc49A522A592e7622A7E711c06bf354 OR token_sold_address = 0x3c3a81e81dc49A522A592e7622A7E711c06bf354))
            -- OR (blockchain = 'optimism' AND (token_bought_address = 0x9d669fD9a297Ed34159B0ce61BE0a4d5c6bb8489 OR token_sold_address = 0x9d669fD9a297Ed34159B0ce61BE0a4d5c6bb8489))
            OR (blockchain = 'bnb' AND (token_bought_address = 0x1ce0c2827e2ef14d5c4f29a091d735a204794041 OR token_sold_address = 0x1ce0c2827e2ef14d5c4f29a091d735a204794041))
            OR (blockchain = 'celo' AND (token_bought_address = 0x8e3670fd7b0935d3fe832711debfe13bb689b690 OR token_sold_address = 0x8e3670fd7b0935d3fe832711debfe13bb689b690))
            OR (blockchain = 'avalanche_c' AND (token_bought_address = 0xB57B60DeBDB0b8172bb6316a9164bd3C695F133a OR token_sold_address = 0xB57B60DeBDB0b8172bb6316a9164bd3C695F133a))
            -- OR (blockchain = 'gnosis' AND (token_bought_address = 0x4b1E2c2762667331Bc91648052F646d1b0d35984 OR token_sold_address = 0x4b1E2c2762667331Bc91648052F646d1b0d35984))
            -- OR (blockchain = 'arbitrum' AND (token_bought_address = 0x1Ca6e7eb4Ba052Ac6CB53E2516061F88821C1eC2 OR token_sold_address = 0x1Ca6e7eb4Ba052Ac6CB53E2516061F88821C1eC2))
            OR (blockchain = 'fantom' AND (token_bought_address = 0x511D35c52a3C244E7b8bd92c0C297755FbD89212 OR token_sold_address = 0x511D35c52a3C244E7b8bd92c0C297755FbD89212))
        )
        -- AND (token_bought_symbol = '{{token_symbol}}' OR token_sold_symbol = '{{token_symbol}}')
        GROUP BY blockchain, project, version, project_contract_address
    )

SELECT 
    rank() OVER(ORDER BY "amount_usd_7d" DESC) AS rank,
    volume_7d.blockchain,
    volume_7d.project,
    volume_7d.version,
    CASE 
        WHEN "amount_usd_24h" IS NULL THEN 0
        ELSE "amount_usd_24h"
    END AS "24hs volume $", 
    CASE 
        WHEN "amount_usd_7d" IS NULL THEN 0
        ELSE "amount_usd_7d"
    END AS "7d volume $",
    volume_7d.project_contract_address
FROM volume_7d
LEFT JOIN volume_24h on volume_24h."project_contract_address" = volume_7d."project_contract_address" and volume_24h.blockchain = volume_7d.blockchain and volume_24h.project = volume_7d.project and volume_24h.version = volume_7d.version
ORDER BY rank ASC
