# WHO Child Growth Standards Data

The data in this directory is derived from the World Health Organization (WHO)
Child Growth Standards.

## Source of Truth

- **Weight-for-age**:
  [https://www.who.int/toolkits/child-growth-standards/standards/weight-for-age](https://www.who.int/toolkits/child-growth-standards/standards/weight-for-age)
- **Length/Height-for-age**:
  [https://www.who.int/toolkits/child-growth-standards/standards/length-height-for-age](https://www.who.int/toolkits/child-growth-standards/standards/length-height-for-age)
- **Head circumference-for-age**:
  [https://www.who.int/toolkits/child-growth-standards/standards/head-circumference-for-age](https://www.who.int/toolkits/child-growth-standards/standards/head-circumference-for-age)

## Methodology

The JSON files contain LMS parameters (L for skewness, M for median, and S for
coefficient of variation) for each age point. These parameters are used to
calculate Z-scores and percentiles using the LMS method.

The current implementation uses the 3rd and 97th percentiles to define the
"expected" growth range.

## Provenance

The JSON files were generated once from the WHO "z-score expanded tables" (daily
values, 0–5 years). The WHO 2006 standards are fixed, so the data is not
expected to change.

Source files:

- [wfa-boys](https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/weight-for-age/expanded-tables/wfa-boys-zscore-expanded-tables.xlsx?sfvrsn=65cce121_10),
  [wfa-girls](https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/weight-for-age/expanded-tables/wfa-girls-zscore-expanded-tables.xlsx?sfvrsn=f01bc813_10)
- [lhfa-boys](https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/length-height-for-age/expandable-tables/lhfa-boys-zscore-expanded-tables.xlsx?sfvrsn=7b4a3428_12),
  [lhfa-girls](https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/length-height-for-age/expandable-tables/lhfa-girls-zscore-expanded-tables.xlsx?sfvrsn=27f1e2cb_10)
- [hcfa-boys](https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/head-circumference-for-age/expanded-tables/hcfa-boys-zscore-expanded-tables.xlsx?sfvrsn=2ab1bec8_8),
  [hcfa-girls](https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/head-circumference-for-age/expanded-tables/hcfa-girls-zscore-expanded-tables.xlsx?sfvrsn=3a34b8b0_8)

Conversion: take the first sheet and map each row's `Day`, `L`, `M` and `S`
columns to `{ age, L, M, S }` (age in days, 0–1856).
