with
    pools as (
        select
            pool, token0, token1, fee
        FROM dex.pools
        WHERE project = 'sushiswap'
    ),





0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f
true
0x60194d04cbcde51d8c006b5ea1bc8927c03eee9d49b8734c904f535384be93a7
1, 0, 5, 0
2023-10-18 05:26
18375148
0x732b40d3105abc7adb3d4e7559f58139c036bf71
0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2
0xef7b100f0333b5c41a4b56b13eeaac5eb7c57741





with 
    trades as (
        select
            project_contract_address as pair,
            sum(amount_usd) as volume
        from dex.trades
        where project = 'sushiswap'
        and amount_usd < 1e10 -- outlier detection
        group by 1, 2
    )

    , pairs as (
        select
            concat(0x, substring(data, 27, 40)) as pair, 
            concat(0x, substring(topic2, 27, 40)) as token0,
            concat(0x, substring(topic3, 27, 40)) as token1
        from
        ethereum.logs
        where
        contract_address = 0xc0aee478e3658e2610c5f7a4a2e1777ce9e4f2ac
        and topic1 = 0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9
    )
    , top_pairs as (
        select p.*, concat(te0.symbol, '-', te1.symbol) as symbol
        from pairs p
        join tokens.erc20 te0 on p.token0 = te0.contract_address
        join tokens.erc20 te1 on p.token1 = te1.contract_address
        where pair in (select pair from trades_accum order by day desc, volume_accum desc limit {{Number of Pair}})
    )

    , transfer as (
        select
            date_trunc('day', evt_block_time) as day,
            "to" as pair,
            contract_address as token,
            sum(cast(value as double)) as transfer
        from erc20_ethereum.evt_Transfer
        where timestamp '{{Start}} 00:00:00' <= evt_block_time and evt_block_time < timestamp '{{End}} 00:00:00'
        and "to" in (select pair from top_pairs) 
        and (contract_address in (select token0 from pairs) or contract_address in (select token1 from pairs))
        group by 1, 2, 3
        
        union all
        
        select
            date_trunc('day', evt_block_time) as day,
            "from" as pair,
            contract_address as token,
            -sum(cast(value as double)) as transfer
        from erc20_ethereum.evt_Transfer
        where timestamp '{{Start}} 00:00:00' <= evt_block_time and evt_block_time < timestamp '{{End}} 00:00:00'
        and "from" in (select pair from top_pairs) 
        and (contract_address in (select token0 from pairs) or contract_address in (select token1 from pairs))
        group by 1, 2, 3
    )

    , tvl as (
        select
            day,
            pair,
            token,
            sum(transfer / power(10, decimals)) over (partition by pair, token order by day asc) as tvl
        from transfer t
        join tokens.erc20 te on t.token = te.contract_address
    )

    , tvl_usd as (
        select
            day,
            pair,
            sum(t.tvl * p.price) as tvl
        from tvl t
        join (select minute, contract_address, price from prices.usd 
            where blockchain = 'ethereum' 
            and timestamp '{{Start}} 00:00:00' <= minute and minute < timestamp '{{End}} 00:00:00') p 
        on t.day = p.minute and t.token = p.contract_address
        where tvl > 0
        group by 1, 2
    )

select tu.day, tu.pair, tp.symbol, tu.tvl, t.volume 
from tvl_usd tu
join trades t on tu.day = t.day and tu.pair = t.pair
join top_pairs tp on tu.pair = tp.pair