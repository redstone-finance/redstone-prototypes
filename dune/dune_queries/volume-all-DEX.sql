WITH 
    volume_24h as (
        SELECT blockchain, project, version, sum(amount_usd) as amount_usd_24h, CAST(project_contract_address as varchar) as project_contract_address
        FROM dex.trades
        WHERE block_time >= cast(now() as timestamp) - interval '1' day
        AND ((blockchain = 'polygon' AND (token_bought_address = {{token_address_polygon}} OR token_sold_address = {{token_address_polygon }}))
            OR (blockchain = 'base' AND (token_bought_address = {{token_address_base}} OR token_sold_address = {{token_address_base}}))
            OR (blockchain = 'ethereum' AND (token_bought_address = {{token_address_ethereum}} OR token_sold_address = {{token_address_ethereum}}))
            OR (blockchain = 'optimism' AND (token_bought_address = {{token_address_optimism}} OR token_sold_address = {{token_address_optimism}}))
            OR (blockchain = 'bnb' AND (token_bought_address = {{token_address_bnb}} OR token_sold_address = {{token_address_bnb}}))
            OR (blockchain = 'celo' AND (token_bought_address = {{token_address_celo}} OR token_sold_address = {{token_address_celo}}))
            OR (blockchain = 'avalanche_c' AND (token_bought_address = {{token_address_avalanche}} OR token_sold_address = {{token_address_avalanche}}))
            OR (blockchain = 'gnosis' AND (token_bought_address = {{token_address_gnosis}} OR token_sold_address = {{token_address_gnosis}}))
            OR (blockchain = 'arbitrum' AND (token_bought_address = {{token_address_arbitrum}} OR token_sold_address = {{token_address_arbitrum}}))
            OR (blockchain = 'fantom' AND (token_bought_address = {{token_address_fantom}} OR token_sold_address = {{token_address_fantom}}))
        )
        -- AND (token_bought_symbol = '{{token_symbol}}' OR token_sold_symbol = '{{token_symbol}}')
        GROUP BY blockchain, project, version, project_contract_address
    )

    , volume_7d as (
        SELECT blockchain, project, version, sum(amount_usd) as amount_usd_7d, CAST(project_contract_address as varchar) as project_contract_address
        FROM dex.trades
        WHERE block_time >= cast(now() as timestamp) - interval '7' day
        AND ((blockchain = 'polygon' AND (token_bought_address = {{token_address_polygon}} OR token_sold_address = {{token_address_polygon }}))
            OR (blockchain = 'base' AND (token_bought_address = {{token_address_base}} OR token_sold_address = {{token_address_base}}))
            OR (blockchain = 'ethereum' AND (token_bought_address = {{token_address_ethereum}} OR token_sold_address = {{token_address_ethereum}}))
            OR (blockchain = 'optimism' AND (token_bought_address = {{token_address_optimism}} OR token_sold_address = {{token_address_optimism}}))
            OR (blockchain = 'bnb' AND (token_bought_address = {{token_address_bnb}} OR token_sold_address = {{token_address_bnb}}))
            OR (blockchain = 'celo' AND (token_bought_address = {{token_address_celo}} OR token_sold_address = {{token_address_celo}}))
            OR (blockchain = 'avalanche_c' AND (token_bought_address = {{token_address_avalanche}} OR token_sold_address = {{token_address_avalanche}}))
            OR (blockchain = 'gnosis' AND (token_bought_address = {{token_address_gnosis}} OR token_sold_address = {{token_address_gnosis}}))
            OR (blockchain = 'fantom' AND (token_bought_address = {{token_address_fantom}} OR token_sold_address = {{token_address_fantom}}))
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