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
