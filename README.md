# AdaMeter

![AdaMeter Logo](resources/logo.png)

AdaMeter is a privacy-first application designed to help you track all aspects
of your newborn baby's development and routines. Built with care in Germany,
AdaMeter prioritizes your data security and privacy above all else.

[![Codecov](https://img.shields.io/codecov/c/github/clentfort/adameter)](https://app.codecov.io/github/clentfort/adameter)
[![Deployment](https://img.shields.io/github/deployments/clentfort/adameter/Production?logo=github&label=Deployment)](https://vercel.com/clentfort-team/adameter)
[![Tests](https://img.shields.io/github/actions/workflow/status/clentfort/adameter/test.yaml?branch=main&label=tests)](https://github.com/clentfort/adameter/actions/workflows/test.yaml)
[![Translations](https://img.shields.io/badge/Translations-Crowdin-blue?logo=crowdin)](https://crowdin.com/project/adameter)

**Your Data, Your Control:**

- **On-Device Storage by Default:** All data is stored locally on your device,
  ensuring you have full control.
- **No External Tracking:** AdaMeter includes absolutely no external tracking or
  analytics. Your usage is your business.
- **No Encryption:** This app does not use encryption.

## How to Use

AdaMeter provides an intuitive interface for tracking various activities and
milestones:

- **Diaper Changes:** Log diaper changes, including type and any notes.
- **Feeding Sessions:** Keep track of breastfeeding (including which side and
  duration), bottle feeds (formula or breast milk), and solid food intake.
- **Growth Measurements:** Record weight, height, and head circumference to
  monitor your baby's growth over time.
- **Custom Events:** Log any other notable events, milestones, or observations,
  such as sleep patterns, medication, or first smiles.
- **Statistics:** Visualize trends and gain insights into your baby's patterns
  through clear charts and summaries.

## Contributing

We welcome contributions to AdaMeter! Whether it's fixing a bug, adding a new
feature, or improving translations, your help is appreciated.

### Getting Started

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally:
    ```bash
    git clone https://github.com/YOUR_USERNAME/adameter.git
    cd adameter
    ```
3.  **Install dependencies** using pnpm:
    ```bash
    pnpm install
    ```
4.  **Create a new branch** for your feature or bug fix:
    ```bash
    git checkout -b my-new-feature
    ```
5.  **Make your changes.**
6.  **Commit your changes** and **push to your fork.**
7.  **Open a Pull Request** against the main AdaMeter repository.

### Translations

AdaMeter uses `fbtee` for internationalization, making it easy to mark strings
in the code as translatable. The actual translation process is managed through
[Crowdin](https://crowdin.com/project/780494).

**Workflow:**

1.  **Marking Strings:** Developers use `<fbt>` tags in React components or
    `fbt()` calls in JavaScript to mark text for translation. See the
    [`fbtee` documentation](https://github.com/nkzw-tech/fbtee) for details.
    Shared or common strings can be managed in `common_strings.json`.
2.  **Collecting Strings:** The command `pnpm run fbtee:collect` (which runs
    `fbtee manifest` and `fbtee collect`) extracts these strings into a
    `source_strings.json` file.
3.  **Uploading to Crowdin:** The `scripts/upload-source-strings.sh` script is
    used to upload `source_strings.json` to the
    [AdaMeter Crowdin project](https://crowdin.com/project/780494).
4.  **Translation:** Translators contribute translations directly on the Crowdin
    platform.
5.  **Downloading Translations:** The `scripts/download-translations.sh` script
    (executed automatically during `pnpm run predev` or `pnpm run prebuild`)
    downloads translated strings from Crowdin into the `translations/`
    directory, with files like `translations/de_DE.json` for German.
6.  **Compiling Translations:** The command `pnpm run fbtee:translate` compiles
    the downloaded files into a single `src/i18n/translations.json` file, which
    is then used by the application.

If you'd like to contribute translations, please join the efforts on
[Crowdin](https://crowdin.com/project/780494).

## Project History

AdaMeter was initially bootstrapped with assistance from
[v0.dev](https://v0.dev/chat/breastfeeding-timer-app-vx0p8JZpkwr). We are
grateful for the initial foundation this provided.

Various parts of this project, including the drafting and structuring of this
README.md, were assisted by Google Jules.

---

Thank you for your interest in AdaMeter!
