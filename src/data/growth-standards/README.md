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

## Updating Data

You can regenerate or update the JSON files using the provided script.

### Option 1: Download from WHO

The script can automatically download the latest XLSX data directly from the
official WHO servers:

```bash
pnpm exec tsx scripts/generate-growth-standards.ts --download
```

The original XLSX files will be stored in the `raw/` directory as a backup.

### Option 2: Convert Local XLSX Files

If you already have the XLSX files in the `raw/` directory, you can convert them
to JSON:

```bash
pnpm exec tsx scripts/generate-growth-standards.ts --convert-local
```
