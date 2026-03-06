/** Timestamp string for export filenames (e.g. "2026-03-04T12-30-45-123"). */
export function getExportTimestamp(): string {
  return new Date()
    .toISOString()
    .slice(0, 19)
    .replace("T", "-")
    .replace(/:/g, "-");
}
