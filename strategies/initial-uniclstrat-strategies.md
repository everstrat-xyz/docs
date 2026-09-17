# The first three Everstrat strategies: parameters, backtests and risks

> **Testing phase.** Everstrat runs on Ethereum mainnet but is still in a testing phase and should be treated as a test protocol. Nothing in this document is a promised or expected return. Strategy returns can be negative.

This document explains how we set the parameters for the first three UniCLStrat strategies. It covers the reasoning behind each choice, what the backtests show, what we assume about performance, and where the strategies can lose money or let you down.

**Data snapshot:** Ethereum mainnet block 25,948,083 (September 2026), ETH ≈ $2,438. Every pool figure below comes from that snapshot and will drift over time.

---

## TL;DR

- Everstrat launches with **three concentrated-liquidity strategies**. Each one sits on a Uniswap V3 ETH/stablecoin pool.
- Every strategy uses a **±20% price range** around the current price. We tested narrower ranges (±5% to ±10%). They show higher fee APRs but **lose more to price movement than they earn**, so we rejected them.
- The deposit split is **45 / 40 / 15**. It is driven by pool depth, how much capital each pool can absorb, and stablecoin risk.
- In backtests, the median result at ±20% was roughly **+8% to +25% per year, measured in ETH**, before the protocol performance fee. The spread was very wide: in the worst 10% of 90-day windows the strategies lost value at an annualised pace of about −57%.
- **The main trade-off:** each strategy holds about half its capital in stablecoins. In a strong ETH rally it will **underperform simply holding ETH**. This is inherent to the design.

---

## 1. What a UniCLStrat strategy does

Deposited ETH is split across strategies. Each strategy provides liquidity to a Uniswap V3 pool in a price range around the current ETH price and earns a share of the pool's trading fees.

- **Position width.** The range is centred on the current price and extends a fixed number of ticks either side.
- **Rebalancing.** If the price drifts too far from the centre, a keeper withdraws the liquidity, swaps the inventory back to roughly 50/50 and re-mints the position around the new price.
- **Calm gate.** The strategy only deposits or rebalances when the pool's spot price is close to its 30-minute average. This protects against flash-loan and short-term price manipulation.
- **Caps.** Each strategy has a maximum size (`maxTotalNAV`) so it never becomes too large a share of its pool.

Everstrat reports value in **ETH**. A strategy "makes money" when it ends up with more ETH-equivalent value than it started with, not more dollars.

---

## 2. The three strategies

| | Strategy A | Strategy B | Strategy C |
|---|---|---|---|
| Pool | [WETH/USDT 0.3%](https://etherscan.io/address/0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36) | [USDC/WETH 0.3%](https://etherscan.io/address/0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8) | [USDC/WETH 0.01%](https://etherscan.io/address/0xE0554a476A092703abdB3Ef35c80e0D76d32939F) |
| Role | Core, deepest pool | Core | High-yield, small capacity |
| Pool reserves | $108.3M | $31.0M | $3.5M |
| 24h volume | $31.8M | $5.1M | $35.0M |
| Daily fees to LPs (24h basis) | ~$95.4k | ~$15.3k | ~$3.5k |
| Share of deposits | **45%** | **40%** | **15%** |
| Strategy cap | 6,000 ETH | 1,000 ETH | 175 ETH |

### Why these pools

- **A: WETH/USDT 0.3%.** This is by far the deepest of the three, with about 6× the active liquidity of the others and the highest absolute fee income. It can absorb a large share of protocol TVL without diluting its own yield.
- **B: USDC/WETH 0.3%.** It has the same ETH/stablecoin exposure as A but uses USDC, which we view as lower tail risk than USDT. The pool is thinner than A, but its fee income per dollar of liquidity is almost the same.
- **C: USDC/WETH 0.01%.** Aggregators send a lot of flow to the cheapest fee tier, so this pool trades about 10× its TVL per day. That gives the highest gross fee APR of the three. The pool is small, though, and much of that flow is arbitrage. That is why C gets a small share and a small cap.

We also looked at the **USDC/WETH 0.05%** pool ($105M TVL, ~$65M/day volume). It is a strong candidate for a fourth strategy. We left it out only to keep the launch to three strategies, and we use it as the swap route for rebalancing.

---

## 3. Parameters and the reasoning behind them

| Parameter | A | B | C | What it means |
|---|---|---|---|---|
| `POSITION_WIDTH` | 30 | 30 | 1,823 | Range half-width, as a multiple of the pool's tick spacing (60 for 0.3% pools, 1 for 0.01%). All three give about **1,800 ticks**, which is **+20% / −16.5%** in price. |
| `REBALANCE_TICK_THRESHOLD` | 900 | 900 | 911 | The strategy re-centres once price has moved about **9.4%** from the centre, which is half the range. |
| `MAX_TICK_DEVIATION` | 100 | 100 | 100 | Calm gate: no deposits or rebalances while spot is more than about **1%** away from the 30-min TWAP. |
| `TWAP_INTERVAL` / `SHORT_TWAP_INTERVAL` | 1800s / 60s | same | same | Averaging windows used by the calm gate. |
| Swap slippage | 25–50 bps | 25–50 bps | 25–50 bps | Rebalancing swaps go through the deep 0.05% pools rather than the LP pool itself. |

At the snapshot price the ranges were about **$2,030 to $2,920**. The ranges re-centre automatically as the price moves.

### 3.1 Why ±20% and not narrower

A narrower range concentrates liquidity, so it earns more fees per dollar. It also loses more to price movement per dollar, and the two effects grow at almost exactly the same rate.

A concentrated position is effectively **short volatility**. When ETH rises, the position sells ETH on the way up. When ETH falls, it buys ETH on the way down. Arbitrageurs capture that difference. This cost is called *loss-versus-rebalancing* (LVR) or impermanent loss, and in this document we call it **structural drag**. The narrower the range, the more concentrated that short-volatility exposure is:

| Range half-width | Short-volatility exposure vs a full-range (Uniswap v2) LP | Loss vs holding when price reaches the range edge |
|---|---|---|
| ±5% | 41.5× | −1.23% |
| ±7.5% | 28.2× | −1.84% |
| ±10% | 21.5× | −2.44% |
| ±15% | 14.8× | −3.61% |
| ±20% | 11.5× | −4.75% |

Note that a ±20% range loses more *per edge touch* than a ±10% range. It reaches the edge far less often, however, and a ±10% range has to rebalance and lock in that loss more than twice as often.

Our first draft proposed ±10% and ±7.5% ranges because they showed the highest *gross* fee APR (about 42–73%). Once we modelled structural drag correctly for concentrated positions, those widths came out **net negative in ETH terms for most pool and dataset combinations**. Moving to ±20% roughly halves gross fee APR but cuts drag by 4–5×. That makes it **net positive for all three strategies on both datasets we tested**.

### 3.2 Why rebalance at half the range

With the threshold at half the band (about 9.4% drift), the position re-centres well before price reaches the edge. In the simulations the position was **in range, and earning fees, close to 100% of the time**, with about **28–32 rebalances per strategy per year**. At ±10% the figure was 73–170 per year. Each rebalance swaps roughly half the position and pays a swap fee, so fewer rebalances directly lowers cost.

### 3.3 Why a 1% calm gate

On a 30-minute TWAP, a 1% gap between spot and TWAP is about a 4-sigma event at current ETH volatility, so the gate rarely triggers in normal markets. It still blocks rebalancing into a manipulated or badly dislocated price. See §6 for the cost of this choice.

### 3.4 Why a 45 / 40 / 15 split

Net backtested results at ±20% are close across the three pools, so return alone does not decide the split. The deciding factors were:

1. **Capacity.** We never want a strategy to hold more than about 10% of its pool's active liquidity. C can hold only about $0.43M on that basis, while A can hold about $14.6M.
2. **Stablecoin tail risk.** USDT is weighted more cautiously than USDC. Capping A at 45% limits USDT exposure to at most 45% of TVL.
3. **Flow toxicity.** The 0.01% tier has the most arbitrage-driven flow, so C's real results are likely to fall further below its gross APR than the others'.
4. **Correlation.** All three are ETH/stablecoin positions, so their price risk is almost perfectly correlated. Splitting across pools diversifies *venue, fee tier and stablecoin* risk, not market risk.

---

## 4. Backtest results

### Method

We simulated each strategy on real ETH price history, following the contract's logic exactly. That includes the same range construction, rebalance triggers and tick rounding. Swap costs are charged on every rebalance, and fees accrue only while the position is in range. We used two independent datasets:

- **Hourly:** 4,000 bars (~167 days), realised volatility 51%/yr.
- **Daily:** 365 bars (~1 year), realised volatility 64%/yr. ETH fell from $4,701 to $2,437 over this period.

Results are computed over overlapping 90-day windows, annualised, and reported as **medians**.

Fee income uses each pool's 24h fee figure from the snapshot. We picked this conservative basis on purpose, because the 6h reading was about 1.4–2× higher.

### Net result in ETH, median %/yr, by range width

| Half-width | A hourly | A daily | B hourly | B daily | C hourly | C daily | Rebalances/yr |
|---|---|---|---|---|---|---|---|
| ±7.5% | −1% | −31% | +2% | −30% | −3% | −22% | 142 |
| ±10% | +18% | −10% | −10% | −24% | +31% | −17% | 73 |
| ±15% | +19% | +1% | +27% | +2% | +30% | +6% | 45 |
| **±20% (chosen)** | **+21%** | **+13%** | **+20%** | **+8%** | **+25%** | **+17%** | **32** |
| ±25% | +24% | +24% | +21% | +22% | +27% | +29% | 24 |
| ±30% | +29% | +32% | +18% | +33% | +32% | +39% | 16 |

### Breakdown at ±20%

| | Gross fee APR | Structural drag (hourly / daily) | Net (hourly / daily) | 10th / 90th percentile | Rebalances/yr |
|---|---|---|---|---|---|
| A | ~24% | −4% / −11% | **+21% / +13%** | −58% / +38% | 32 / 28 |
| B | ~23% | −4% / −14% | **+20% / +8%** | −57% / +45% | 32 / 26 |
| C | ~30% | −7% / −12% | **+25% / +17%** | −57% / +44% | 32 / 28 |

**Blended at 45 / 40 / 15:** roughly **+12%/yr (daily data) to +21%/yr (hourly data)** in ETH terms. The 10th to 90th percentile range is about **−57% to +40%**.

### Why not go even wider (±25–30%)?

Wider ranges scored *higher* in the backtest. We are not using them yet for two reasons. First, the sample is thin (see §5). Second, very wide ranges start to behave like a plain full-range LP, which gives up the capital efficiency that justifies a concentrated strategy. We plan to **revisit the width after 4–6 weeks of live data**. If live results track the model, widening further is the likely next step.

---

## 5. Performance assumptions and limits of the analysis

Please read this section before drawing conclusions from the numbers above.

- **The medians are not an APR forecast.** The 10th to 90th percentile spread is about 100 percentage points. The most reliable finding is the *ranking* of widths, which held on both datasets. The exact numbers are much less reliable.
- **Small sample.** One year of daily data split into 90-day windows gives only about 4 truly independent observations, and the hourly set gives about 2. Re-running on a longer hourly window moved medians by up to about 25 points, although the ranking and signs did not change.
- **Market regime.** The daily dataset covers a period when ETH roughly halved. In ETH terms, a half-stablecoin position benefits from falling prices and suffers in rallies (see §6.1). A different market could give very different results.
- **Fee model.** Fees are modelled as a constant rate while in range. A volume-weighted variant cut hourly medians by about 10 points at every width. The truth is probably somewhere between the two models.
- **Volume regime.** Fee income depends on trading volume, which can drop sharply in quiet weeks.
- **Performance fee not included.** The protocol's performance fee (up to 20%, minted as EVE to the treasury) is charged on *gross* LP fees, not on net results. At a ~24% gross APR, a 10% fee rate would take about 2.4 points off the figures above, and it applies even in periods when net results are negative.
- **Minor omissions.** The single-sided leftover position is not modelled, which slightly understates fee income.
- **Snapshot dependence.** Pool depth, volume and ETH price will all change. The parameters (range width, thresholds) are durable, but the dollar figures and price ranges are not.

The closed-form results in §3.1 and §6.1 (exposure multiples and value after a price move) are exact math. They do not depend on the backtest sample.

---

## 6. Downsides and risks

### 6.1 You will underperform holding ETH in a strong rally

Each strategy holds about half its value in stablecoins. When ETH rises, the position keeps converting ETH into stablecoins. If ETH moves far enough, the position ends up entirely in stablecoins until the next rebalance.

Value of a ±20% position **measured in ETH**, before fees and before any rebalance:

| ETH price move | Change in ETH-denominated value |
|---|---|
| +10% | −5.8% |
| +30% | −19.4% |
| +50% | −30.2% |
| −10% | +3.9% |
| −30% | +4.8% |
| −50% | +4.8% |

The upside in a crash is small and capped. Once price reaches the bottom of the range, the position is 100% ETH and rides the rest of the fall. The downside in a rally, measured in ETH, is much larger. Fees are meant to make up for this over time, but in a sustained trend they may not. **This is inherent to the product, not a bug.**

### 6.2 Results can be negative for long stretches

Even at the chosen width, about 10% of 90-day backtest windows lost value at an annualised pace worse than −55% in ETH terms. Periods like that can happen and are not a malfunction.

### 6.3 Volatile markets can pause deposits and slow exits

During sharp price moves the calm gate blocks deposits and rebalances. All three strategies hold near-identical ETH/stablecoin exposure, so **they tend to pause at the same time**. While a strategy is unhealthy, the keeper tries to rebalance it before doing anything else. As a result, providing exit liquidity from strategies can be delayed until the market calms down. That delay can land exactly when many users want to withdraw. The gate should rarely trigger at the 1% setting. We will monitor it and adjust the setting if it fires in practice.

### 6.4 Stablecoin depeg

A lasting USDT depeg would hit Strategy A's NAV, both through its USDT inventory and through rebalances forced at bad prices. A USDC depeg would affect B and C in the same way. The split limits exposure to any single stablecoin to at most 45% of TVL, but it does not remove the risk.

### 6.5 Toxic flow in the 0.01% pool

Strategy C's high volume is mostly arbitrage, which is the most costly flow for LPs. If C's live results fall below B's after 4–6 weeks, we intend to cut its share from 15% to about 5%. That change needs no redeployment.

### 6.6 Capacity limits: idle ETH at higher TVL

The caps (6,000 / 1,000 / 175 ETH) do not match the 45 / 40 / 15 split. The split holds only until Strategy C fills up, at roughly **1,170 ETH of protocol TVL**. Above that, the share of new deposits meant for C is **not automatically sent to A and B**. It stays idle until a keeper re-runs allocation or governance zeroes C's weight. Idle ETH earns nothing. Total capacity across all three strategies is about 7,160 ETH (~$17M) at the snapshot.

### 6.7 A and B will not perform identically

A and B have the same nominal parameters, but the contract's tick rounding places the range centre slightly below spot for A and slightly above spot for B, because the token order is reversed in those pools. At the chosen threshold the effect is small, but it leaves B on the less favourable side. It is negligible for C.

### 6.8 Rebalance and execution costs

Each rebalance withdraws the position, swaps about half of it and re-mints the position. Gas cost is minor. The real cost is the swap fee and slippage, which is why swaps go through the deepest 0.05% pools with tight slippage limits. We expect about 30 rebalances per strategy per year.

### 6.9 Smart contract and protocol risk

These strategies depend on Everstrat's contracts, Uniswap V3, Chainlink price feeds (a missing or failing stablecoin feed would freeze NAV calculation protocol-wide) and an off-chain keeper. The software is experimental.

---

## 7. What we will monitor and possibly change

| Signal | Possible action |
|---|---|
| Live net results track the backtest after 4–6 weeks | Consider widening ranges toward ±25–30% |
| Strategy C underperforms Strategy B | Reduce C's deposit share from 15% to ~5% |
| Protocol TVL approaches ~1,000 ETH | Prepare to rebalance weights before C's cap binds |
| Calm gate triggers in practice | Revisit `MAX_TICK_DEVIATION` |
| USDC/WETH 0.05% remains the deepest venue | Evaluate it as a fourth strategy |

Changes to strategy weights, parameters and new strategies are admin actions and go through the protocol's timelock.

---

## Appendix: how to verify

- The parameter set is checked against live pool state in a mainnet fork test in [everstrat-xyz/contracts#48](https://github.com/everstrat-xyz/contracts/pull/48) (`test/fork/UniCLStratBootstrapParams.t.sol`).
- Tick-to-price conversion: `price = 1.0001^tick`, adjusted for the 18-decimal WETH / 6-decimal stablecoin pair.
- Concentrated position value in range `[Sa, Sb]`: `V(S) = L·(2√S − S/√Sb − √Sa)`. ETH-denominated value = `V(S) / S`.
- Pool data: on-chain `slot0`, `liquidity`, `fee` and `tickSpacing` at block 25,948,083. Volume, reserves and OHLCV come from GeckoTerminal, with price history taken from the USDC/WETH 0.05% pool.
