# Operational Recovery Guide

This guide provides instructions for recovering data in case of sync-related
data loss or invisibility.

## Identifying Invisible Data

If you believe data is missing but should be there (e.g., after a sync with a
stale client), it might just be "invisible" because it lost its `profileId`
link. Current UI filters often hide data that isn't explicitly linked to the
selected profile.

### Inspecting Local Data

1.  **Export CSV/JSON**: Use the in-app export feature to get a backup of your
    current local data.
2.  **Check for Missing `profileId`**: Open the exported CSV files (e.g.,
    `diaperChanges.csv`) and check if the `profileId` column is empty for most
    rows.
3.  **Check Profile Table**: Inspect `profiles.csv` to see how many profiles
    exist and what their IDs are.

## Recovery Procedures

### Automatic Repair

The app includes a repair migration (`2026-06-01-repair-missing-profile-ids`)
that attempts to automatically link orphaned data if:

- Exactly one profile exists in the system.
- OR a `selectedProfileId` is set to a valid profile.

If the migration didn't run or didn't fix everything (e.g., in a multi-profile
setup where the app didn't want to "guess" the owner), you can try the
following:

### Manual Recovery via Import

If automatic repair failed, you can manually fix a backup and re-import it:

1.  **Prepare a Fix**:
    - Open your exported CSV files.
    - Copy a valid profile ID from `profiles.csv`.
    - Paste this ID into the `profileId` column for all affected rows in other
      CSV files.
2.  **Import Fixed Data**:
    - Use the in-app import feature.
    - Choose the "Merge" or "Overwrite" strategy depending on your needs.
      Overwrite is recommended if you want to cleanly replace the corrupted
      state.

### Reverting to a Previous Backup

If you have a known-good backup ZIP/JSON from before the sync issue:

1.  Go to Settings > Data Management.
2.  Select "Import Backup".
3.  Choose your good backup file.

## Prevention

To prevent future sync-related issues:

- **Keep Clients Updated**: Ensure all devices are running the latest version of
  AdaMeter.
- **Check Sync Status**: If the app logs an error about "Snapshot save blocked",
  it means a potential data loss was detected and prevented from being pushed to
  other devices. Contact support or inspect your local data before continuing.
