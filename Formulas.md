# Mathematical Framework & Product Formulas

## 1. Daily Safe-to-Save Engine
`Safe-to-Save = MAX(0, (Daily_Income - Daily_Expenses) * (1 - Buffer_Margin))`

## 2. Buffer Days & Resilience Score
`Buffer_Days = Total_Liquid_Cash / Average_Daily_Essential_Expense`

`Resilience_Score = (0.50 * Buffer_Score) + (0.30 * Income_Stability_Score) - (0.20 * Cash_Volatility_Ratio)`

## 3. Responsible Credit Guardrails
`Affordability_Ceiling = (Baseline_Monthly_Income - Fixed_Monthly_Outflows) * 0.35`

`Debt_Stress_Ratio = Projected_Repayment / Net_Discretionary_Cashflow`
- **Rule**: If Debt_Stress_Ratio > 0.40, auto-decline or downscale limit.
