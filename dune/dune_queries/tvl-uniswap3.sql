with 
    pairs_ethereum as (
        select pool,token0,token1, fee
        from uniswap_v3_ethereum.Factory_evt_PoolCreated
        -- where pool = 0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640
    )

     , balance0_ethereum as (
          select 
              pair
              , token_address 
              , sum(amount) as amount
          from (
              select 
                  to as pair
                  , tr.contract_address as token_address
                  , sum(cast(value as double) / pow(10, coalesce(tk.decimals, 18))) as amount
              from erc20_ethereum.evt_Transfer tr
              join pairs_ethereum p 
                on p.pool = tr.to
                    and p.token0 = tr.contract_address
              left join tokens.erc20 tk
                on tk.contract_address = p.token0
                    and tk.blockchain = 'ethereum'
              where to in (select pool from pairs_ethereum)
              group by 1,2
               
              union all
               
              select 
                  "from" as pair
                  , tr.contract_address as token_address
                  , sum(cast(value as double) / pow(10, coalesce(tk.decimals, 18))) * (-1)as amount
              from erc20_ethereum.evt_Transfer tr
              join pairs_ethereum p 
                on p.pool = tr."from"
                    and p.token0 = tr.contract_address
              left join tokens.erc20 tk
                on tk.contract_address = p.token0
                    and tk.blockchain = 'ethereum'
              where "from" in (select pool from pairs_ethereum)
              group by 1,2
              )a
          group by 1,2
    )
           
    , balance1_ethereum as (
        select 
           pair
           , token_address 
           , sum(amount) as amount
       from (
           select 
               to as pair
               , tr.contract_address as token_address
               , sum(cast(value as double) / pow(10, coalesce(tk.decimals, 18))) as amount
           from erc20_ethereum.evt_Transfer tr
           join pairs_ethereum p 
            on p.pool= tr.to
                and p.token1 = tr.contract_address
           left join tokens.erc20 tk
            on tk.contract_address = p.token1
                and tk.blockchain = 'ethereum'
           where to in (select pool from pairs_ethereum)
           group by 1,2
           
           union all
           
           select 
               "from" as pair
               , tr.contract_address as token_address
               , sum(cast(value as double) / pow(10, coalesce(tk.decimals, 18))) * (-1)as amount
           from erc20_ethereum.evt_Transfer tr
           join pairs_ethereum p 
            on p.pool = tr."from"
                and p.token1 = tr.contract_address
           left join tokens.erc20 tk
            on tk.contract_address = p.token1
                and tk.blockchain = 'ethereum'
           where "from" in (select pool from pairs_ethereum)
           group by 1,2
           )a
       group by 1,2
    )
    
    , labels_ethereum as (
        select 
            b0.pair as pair
            , b0.token_address as tk0_address
            , p0.symbol as tk0_symbol
            , b0.amount as tk0_amount
            , b0.amount * p0.price as tk0_amount_usd
            , b1.token_address as tk1_address
            , p1.symbol as tk1_symbol
            , b1.amount as tk1_amount
            , b1.amount * p1.price as tk1_amount_usd
        from balance0_ethereum b0
        left join balance1_ethereum b1
            on b1.pair = b0.pair
        left join prices.usd_latest p0 
            on p0.contract_address = b0.token_address
                and p0.blockchain = 'ethereum'
        left join prices.usd_latest p1 
            on p1.contract_address = b1.token_address
                and p1.blockchain = 'ethereum'        
    )

    , partial_info_ethereum as (
        select 
            tk0_symbol || '-' || tk1_symbol as pool
            , pair as pool_address
            -- , '<a href="https://v2.info.uniswap.org/pair/' || cast(pair as varchar) || '" target="_blank">' || '0x..'||substring(cast(pair as varchar), 39, 42) || '</a>' as pool_address
            , tk0_symbol
            , tk0_amount
            , tk0_amount_usd
            , tk1_symbol
            , tk1_amount
            , tk1_amount_usd
        from labels_ethereum
        where tk0_amount_usd + tk1_amount_usd > 1
        and pair not in (0x5c24b84701916d968dcc7bdd6a4c5236bed460b9)
    )

, reclassifying_values_ethereum as (
    select 
        pool
        , pool_address
        , tk0_amount
        , case when cast(tk0_symbol as varchar) = 'WISE' then tk0_amount * 0.14
            else tk0_amount_usd
        end as tk0_amount_usd
        , tk1_amount
        , tk1_amount_usd
    from partial_info_ethereum
    )

    , final_ethereum as (
        select 
            pool
            , pool_address
            , tk0_amount
            , tk1_amount
            , tk0_amount_usd + tk1_amount_usd as tvl
        from reclassifying_values_ethereum
    )

    , total_tvl_ethereum as (
        select sum(tvl) as total_tvl
        from final_ethereum
    )
    
    , one_day_volume_ethereum as (
        select 
            project_contract_address
            , sum(amount_usd) as volume
        from dex.trades d 
        where project_contract_address in (select pool_address from final_ethereum) 
            and project = 'uniswap' and version = '3'
            and d.blockchain = 'ethereum'
            and block_time > now() - interval '24' hour
        group by 1
    )
    
    , seven_days_volume_ethereum as (
        select 
            project_contract_address
            , sum(amount_usd) as volume
        from dex.trades d 
        where project_contract_address in (select pool_address from final_ethereum) 
            and project = 'uniswap' and version = '3'
            and d.blockchain = 'ethereum'
            and block_time > now() - interval '7' day
        group by 1 
    )
    , results_ethereum as (
        select
            'ethereum' as blockchain
            , '<a href="https://info.uniswap.org/#/pools/' || cast(f.pool_address as varchar) || '" target="_blank">' || f.pool || '</a>' as pool
            , cast(p.fee  as double) / pow(10,6) as fee
            , tvl
            , case when o.volume is null then 0 else o.volume end as "24Hs Volume $"
            , case when s.volume is null then 0 else s.volume end as "7d Volume $"
            , tk0_amount
            , tk1_amount
            , total_tvl
        from final_ethereum f
        left join total_tvl_ethereum on 1=1
        left join one_day_volume_ethereum o 
            on f.pool_address  = o.project_contract_address
        left join seven_days_volume_ethereum s
            on f.pool_address  = s.project_contract_address
        left join pairs_ethereum p
            on p.pool = f.pool_address
    )


    , pairs_arbitrum as (
        select pool,token0,token1, fee
        from uniswap_v3_arbitrum.Factory_evt_PoolCreated
        -- where pool = 0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640
    )

     , balance0_arbitrum as (
          select 
              pair
              , token_address 
              , sum(amount) as amount
          from (
              select 
                  to as pair
                  , tr.contract_address as token_address
                  , sum(cast(value as double) / pow(10, coalesce(tk.decimals, 18))) as amount
              from erc20_arbitrum.evt_Transfer tr
              join pairs_arbitrum p 
                on p.pool = tr.to
                    and p.token0 = tr.contract_address
              left join tokens.erc20 tk
                on tk.contract_address = p.token0
                    and tk.blockchain = 'arbitrum'
              where to in (select pool from pairs_arbitrum)
              group by 1,2
               
              union all
               
              select 
                  "from" as pair
                  , tr.contract_address as token_address
                  , sum(cast(value as double) / pow(10, coalesce(tk.decimals, 18))) * (-1)as amount
              from erc20_arbitrum.evt_Transfer tr
              join pairs_arbitrum p 
                on p.pool = tr."from"
                    and p.token0 = tr.contract_address
              left join tokens.erc20 tk
                on tk.contract_address = p.token0
                    and tk.blockchain = 'arbitrum'
              where "from" in (select pool from pairs_arbitrum)
              group by 1,2
              )a
          group by 1,2
    )
           
    , balance1_arbitrum as (
        select 
           pair
           , token_address 
           , sum(amount) as amount
       from (
           select 
               to as pair
               , tr.contract_address as token_address
               , sum(cast(value as double) / pow(10, coalesce(tk.decimals, 18))) as amount
           from erc20_arbitrum.evt_Transfer tr
           join pairs_arbitrum p 
            on p.pool= tr.to
                and p.token1 = tr.contract_address
           left join tokens.erc20 tk
            on tk.contract_address = p.token1
                and tk.blockchain = 'arbitrum'
           where to in (select pool from pairs_arbitrum)
           group by 1,2
           
           union all
           
           select 
               "from" as pair
               , tr.contract_address as token_address
               , sum(cast(value as double) / pow(10, coalesce(tk.decimals, 18))) * (-1)as amount
           from erc20_arbitrum.evt_Transfer tr
           join pairs_arbitrum p 
            on p.pool = tr."from"
                and p.token1 = tr.contract_address
           left join tokens.erc20 tk
            on tk.contract_address = p.token1
                and tk.blockchain = 'arbitrum'
           where "from" in (select pool from pairs_arbitrum)
           group by 1,2
           )a
       group by 1,2
    )
    
    , labels_arbitrum as (
        select 
            b0.pair as pair
            , b0.token_address as tk0_address
            , p0.symbol as tk0_symbol
            , b0.amount as tk0_amount
            , b0.amount * p0.price as tk0_amount_usd
            , b1.token_address as tk1_address
            , p1.symbol as tk1_symbol
            , b1.amount as tk1_amount
            , b1.amount * p1.price as tk1_amount_usd
        from balance0_arbitrum b0
        left join balance1_arbitrum b1
            on b1.pair = b0.pair
        left join prices.usd_latest p0 
            on p0.contract_address = b0.token_address
                and p0.blockchain = 'arbitrum'
        left join prices.usd_latest p1 
            on p1.contract_address = b1.token_address
                and p1.blockchain = 'arbitrum'        
    )

    , partial_info_arbitrum as (
        select 
            tk0_symbol || '-' || tk1_symbol as pool
            , pair as pool_address
            , tk0_symbol
            , tk0_amount
            , tk0_amount_usd
            , tk1_symbol
            , tk1_amount
            , tk1_amount_usd
        from labels_arbitrum
        where tk0_amount_usd + tk1_amount_usd > 1
        and pair not in (0x5c24b84701916d968dcc7bdd6a4c5236bed460b9)
    )

, reclassifying_values_arbitrum as (
    select 
        pool
        , pool_address
        , tk0_amount
        , tk0_amount_usd
        , tk1_amount
        , tk1_amount_usd
    from partial_info_arbitrum
    )

    , final_arbitrum as (
        select 
            pool
            , pool_address
            , tk0_amount
            , tk1_amount
            , tk0_amount_usd + tk1_amount_usd as tvl
        from reclassifying_values_arbitrum
    )

    , total_tvl_arbitrum as (
        select sum(tvl) as total_tvl
        from final_arbitrum
    )
    
    , one_day_volume_arbitrum as (
        select 
            project_contract_address
            , sum(amount_usd) as volume
        from dex.trades d 
        where project_contract_address in (select pool_address from final_arbitrum) 
            and project = 'uniswap' and version = '3'
            and d.blockchain = 'arbitrum'
            and block_time > now() - interval '24' hour
        group by 1
    )
    
    , seven_days_volume_arbitrum as (
        select 
            project_contract_address
            , sum(amount_usd) as volume
        from dex.trades d 
        where project_contract_address in (select pool_address from final_arbitrum) 
            and project = 'uniswap' and version = '3'
            and d.blockchain = 'arbitrum'
            and block_time > now() - interval '7' day
        group by 1 
    )

    , results_arbitrum as(
        select
            'arbitrum' as blockchain
            , '<a href="https://info.uniswap.org/#/arbitrum/pools/' || cast(f.pool_address as varchar) || '" target="_blank">' || f.pool || '</a>' as pool
            , cast(p.fee  as double) / pow(10,6) as fee
            , tvl
            , case when o.volume is null then 0 else o.volume end as "24Hs Volume $"
            , case when s.volume is null then 0 else s.volume end as "7d Volume $"
            , tk0_amount
            , tk1_amount
            , total_tvl
        from final_arbitrum f
        left join total_tvl_arbitrum on 1=1
        left join one_day_volume_arbitrum o 
            on f.pool_address  = o.project_contract_address
        left join seven_days_volume_arbitrum s
            on f.pool_address  = s.project_contract_address
        left join pairs_arbitrum p
            on p.pool = f.pool_address
    )

-- Combine the results using UNION ALL
select 
    rank() over(order by tvl desc) as rank
    , * 
from (
    select * from results_ethereum
    union all
    select * from results_arbitrum
) as combined_results
order by 5 desc;
        