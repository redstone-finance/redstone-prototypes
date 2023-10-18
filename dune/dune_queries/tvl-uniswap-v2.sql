with 
    pairs as (
        select pair,token0,token1
        from uniswap_v2_ethereum.Factory_evt_PairCreated
        -- where pair = 0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852
    )

     , balance0 as (
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
              join pairs p 
                on p.pair = tr.to
                    and p.token0 = tr.contract_address
              left join tokens.erc20 tk
                on tk.contract_address = p.token0
                    and tk.blockchain = 'ethereum'
              where to in (select pair from pairs)
              group by 1,2
               
              union all
               
              select 
                  "from" as pair
                  , tr.contract_address as token_address
                  , sum(cast(value as double) / pow(10, coalesce(tk.decimals, 18))) * (-1)as amount
              from erc20_ethereum.evt_Transfer tr
              join pairs p 
                on p.pair = tr."from"
                    and p.token0 = tr.contract_address
              left join tokens.erc20 tk
                on tk.contract_address = p.token0
                    and tk.blockchain = 'ethereum'
              where "from" in (select pair from pairs)
              group by 1,2
              )a
          group by 1,2
    )
           
    , balance1 as (
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
           join pairs p 
            on p.pair = tr.to
                and p.token1 = tr.contract_address
           left join tokens.erc20 tk
            on tk.contract_address = p.token1
                and tk.blockchain = 'ethereum'
           where to in (select pair from pairs)
           group by 1,2
           
           union all
           
           select 
               "from" as pair
               , tr.contract_address as token_address
               , sum(cast(value as double) / pow(10, coalesce(tk.decimals, 18))) * (-1)as amount
           from erc20_ethereum.evt_Transfer tr
           join pairs p 
            on p.pair = tr."from"
                and p.token1 = tr.contract_address
           left join tokens.erc20 tk
            on tk.contract_address = p.token1
                and tk.blockchain = 'ethereum'
           where "from" in (select pair from pairs)
           group by 1,2
           )a
       group by 1,2
    )
    
    , adding_usd as (
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
        from balance0 b0
        left join balance1 b1
            on b1.pair = b0.pair
        left join prices.usd_latest p0 
            on p0.contract_address = b0.token_address
                and p0.blockchain = 'ethereum'
        left join prices.usd_latest p1 
            on p1.contract_address = b1.token_address
                and p1.blockchain = 'ethereum'        
    )

    , partial_info as (
        select 
            tk0_symbol || '-' || tk1_symbol as pool
            , pair as pool_address
            , tk0_symbol
            , tk0_amount
            , case when tk0_amount_usd is null then 0 else tk0_amount_usd end as tk0_amount_usd
            , tk1_symbol
            , tk1_amount
            , case when tk1_amount_usd is null then 0 else tk1_amount_usd end as tk1_amount_usd
        from adding_usd
        where tk0_amount_usd + tk1_amount_usd > 1
        and pair not in (0x5c24b84701916d968dcc7bdd6a4c5236bed460b9)
    )

    , reclassifying_values as (
        select 
            pool
            , pool_address
            , tk0_amount
            , case when cast(tk0_symbol as varchar) = 'WISE' then tk0_amount * 0.14
                else tk0_amount_usd
            end as tk0_amount_usd
            , tk1_amount
            , tk1_amount_usd
        from partial_info
    )

    , final as (
        select 
            pool
            , pool_address
            , tk0_amount
            , tk1_amount
            , tk0_amount_usd + tk1_amount_usd as tvl
        from reclassifying_values
    )

    , total_tvl as (
        select sum(tvl) as total_tvl
        from final
    )
    
    , one_day_volume as (
        select 
            project_contract_address
            , sum(amount_usd) as volume
        from dex.trades d 
        where project_contract_address in (select pool_address from final) 
            and project = 'uniswap' and version = '2'
            and d.blockchain = 'ethereum'
            and block_time > now() - interval '24' hour
        group by 1
    )
    
    , seven_days_volume as (
        select 
            project_contract_address
            , sum(amount_usd) as volume
        from dex.trades d 
        where project_contract_address in (select pool_address from final) 
            and project = 'uniswap' and version = '2'
            and d.blockchain = 'ethereum'
            and block_time > now() - interval '7' day
        group by 1 
    )

select 
    rank() over(order by tvl desc) as rank
    , '<a href="https://v2.info.uniswap.org/pair/' || cast(pool_address as varchar) || '" target="_blank">' || pool || '</a>' as pool
    , 0.003 as fee
    , tvl
    , case when o.volume is null then 0 else o.volume end as "24Hs Volume $"
    , case when s.volume is null then 0 else s.volume end as "7d Volume $"
    , tk0_amount
    , tk1_amount
    , total_tvl
from final f
left join total_tvl on 1=1
left join one_day_volume o 
    on f.pool_address  = o.project_contract_address
left join seven_days_volume s
    on f.pool_address  = s.project_contract_address
order by 4 desc
