# ResilientBank Financial Formulas

`databaseHandlers.js` is the executable source of truth. This document explains
the same formulas for maintainers and AI coding tools.

All numeric inputs are normalized, capped to a safe upper bound, and prevented
from producing negative or non-finite outputs.

## Monthly essential expenses

```text
monthly essentials = rent + food + utilities + transport + debt payments
```

## Daily burn rate

```text
daily burn rate = max(1, monthly essentials / 30)
```

The minimum divisor-facing value of ₹1 prevents division by zero.

## Buffer days

```text
buffer days = max(0, floor(current available balance / daily burn rate))
```

Emergency savings are tracked separately from currently available balance.

## Resilience score

```text
buffer component = min(70, buffer days * 1.5)
stability component =
  25 for salaried work
  15 for gig/freelance work
  10 otherwise

resilience score =
  clamp(round(buffer component + stability component), 0, 100)
```

## Safe to save

```text
room after essentials = max(0, today's inflow - daily burn rate)
safe to save = max(0, round(room after essentials * 0.8))
```

The remaining 20% is an extra uncertainty margin. The server verifies this
again before committing a transfer.

## Expected 14-day income

```text
expected 14-day income = expected daily income * 14
```

The expected daily income entered during onboarding is persisted as the
canonical value so it does not drift when generated transaction history is
reloaded.

## Credit affordability ceiling

```text
14-day essential cost = daily burn rate * 14
discretionary 14-day cash flow =
  max(0, expected 14-day income - 14-day essential cost)

affordability ceiling =
  max(0, round(discretionary 14-day cash flow * 0.4))
```

A requested amount above this ceiling activates the circuit breaker and should
be reduced to the ceiling. This is guidance, not a lending approval.

## Savings transfer invariant

```text
new available balance = old available balance - transfer
new emergency savings = old emergency savings + transfer
```

The transfer must not exceed either the available balance or the current
safe-to-save amount. Operation IDs and an atomic compare-and-swap prevent
duplicate or concurrent over-transfers.