# Nonprofit Form 990 Tracker — Revenue, Expenses & Filings

Look up nonprofits by name or EIN and get their most recent Form 990
filings: total revenue, expenses, assets, liabilities, and a link to the
filed PDF — without digging through IRS filings or ProPublica's site by
hand.

Built for journalists, donors, and grantmakers doing due diligence, and
nonprofits benchmarking against peer organizations.

## Input

```json
{
  "organizations": ["code for america", "27-1067272"],
  "state": "CA",
  "maxFilingsReturned": 3
}
```

| Field | Type | Description |
|---|---|---|
| `organizations` | array of strings | Nonprofits to look up, by EIN (`"27-1067272"`) or name keyword (`"code for america"`). Name searches use the top match. One lookup is billed per entry. |
| `state` | string (optional) | Two-letter state code to disambiguate name searches with common names (e.g. `"CA"`). Ignored for EIN lookups. |
| `maxFilingsReturned` | number | Max recent filing years to return per organization. Default `3`, max `10`. |

## Output

One record per filing year:

```json
{
  "ein": 271067272,
  "orgName": "Code For America Labs",
  "nteeCode": "W20",
  "city": "San Francisco",
  "state": "CA",
  "taxYear": 2023,
  "totalRevenue": 37925846,
  "totalExpenses": 43413036,
  "totalAssetsEnd": 86095198,
  "totalLiabilitiesEnd": 895892,
  "filingUpdatedAt": "2025-08-05T16:08:40.814Z",
  "pdfUrl": "https://projects.propublica.org/nonprofits/download-filing?path=..."
}
```

An organization with no e-filed 990 data on record returns no items but
is still billed once for the lookup.

## How it works

Direct calls to the official [ProPublica Nonprofit Explorer API](https://projects.propublica.org/nonprofits/api/),
built on IRS Form 990 e-file data. No proxy, no scraping.

## Pricing note

Billed per **organization checked**, not per filing year returned — one
charge per entry whether it has 1 or 10 matching filings.

## Related products

- [Grant Opportunity Tracker](https://github.com/timmKal01/grant-opportunity-tracker) — new federal funding a nonprofit could apply for, rather than its own past filings
- [SEC 8-K Material Event Tracker](https://github.com/timmKal01/sec-8k-material-event-tracker) — the for-profit equivalent: material events from public company filings
