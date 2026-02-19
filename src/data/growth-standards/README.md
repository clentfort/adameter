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

### Easiest: Download from Mirror

The script can automatically download the latest data from a reliable mirror:

```bash
npx tsx scripts/generate-growth-standards.ts --download
```

### From Official WHO Source

1. Download the "z-scores" tables (Excel format) from the official WHO Toolkit pages:
   - [Weight-for-age](https://www.who.int/toolkits/child-growth-standards/standards/weight-for-age)
   - [Length/height-for-age](https://www.who.int/toolkits/child-growth-standards/standards/length-height-for-age)
   - [Head circumference-for-age](https://www.who.int/toolkits/child-growth-standards/standards/head-circumference-for-age)
2. Open the Excel files and save the data as tab-separated TXT or CSV files.
3. Place the TXT files in a directory.
4. Run the script pointing to that directory:
   ```bash
   npx tsx scripts/generate-growth-standards.ts /path/to/directory
   ```
