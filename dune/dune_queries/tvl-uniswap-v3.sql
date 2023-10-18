WITH
    results_ethereum AS ( SELECT 'Ethereum' as blockchain, * FROM dune.damiad.result_lp_uni_v_3_ethereum )
    , results_arbitrum AS ( SELECT 'Arbitrum' as blockchain, * FROM dune.damiad.result_lp_uni_v_3_arbitrum )
    , results_polygon AS ( SELECT 'Polygon' as blockchain, * FROM dune.damiad.result_lp_uni_v_3_polygon )
    , results_optimisim AS ( SELECT 'Optimism' as blockchain, * FROM dune.damiad.result_lp_uni_v_3_optimism )
    , results_bnb AS ( SELECT 'Bnb' as blockchain, * FROM dune.damiad.result_lp_uni_v_3_bnb )

SELECT
    rank() over(ORDER BY tvl DESC) AS rank, * 
FROM (
    SELECT * FROM results_ethereum
    UNION ALL
    SELECT * FROM results_arbitrum
    UNION ALL
    SELECT * FROM results_polygon
    UNION ALL
    SELECT * FROM results_optimisim
    UNION ALL
    SELECT * FROM results_bnb
) AS combined_results
ORDER BY tvl DESC;